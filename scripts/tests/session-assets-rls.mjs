// RLS regression test for public.session_assets
//
// Verifies the security model enforced by Row Level Security on the
// session_assets table. This guards against the regressions that led to
// 20251108000001_temporary_disable_rls.sql (RLS being disabled to "fix" an
// upload flow that was actually failing due to VITE_SKIP_AUTH=true / an
// unauthenticated client).
//
// Matrix:
//   - anon SELECT succeeds (player screens need public read)
//   - anon INSERT / UPDATE / DELETE are blocked
//   - authenticated INSERT with gm_id = auth.uid() succeeds (upload flow)
//   - authenticated INSERT with a foreign gm_id is blocked (ownership)
//   - authenticated UPDATE/DELETE on own row succeeds
//   - authenticated UPDATE/DELETE on someone else's row is blocked
//
// Exit code is 0 when all assertions pass, 1 otherwise (CI-friendly).
//
// Usage:
//   node scripts/tests/session-assets-rls.mjs
//
// Required env vars (never hardcode keys — these are secrets):
//   SUPABASE_URL              e.g. https://<project-ref>.supabase.co
//   SUPABASE_ANON_KEY         publishable/anon key
//   SUPABASE_SERVICE_ROLE_KEY service role key (admin)

import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const supabaseUrl = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error(
    'Missing required env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY'
  )
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
const anon = createClient(supabaseUrl, anonKey)
const authed = createClient(supabaseUrl, anonKey)

let passed = 0
let failures = 0

function assert(condition, label) {
  if (condition) {
    passed += 1
    console.log(`  ✅ ${label}`)
  } else {
    failures += 1
    console.error(`  ❌ ${label}`)
  }
}

const testTag = `rls-test-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`

function row(overrides = {}) {
  return {
    asset_type: 'scene',
    storage_bucket: 'scenes',
    storage_path: `${testTag}/${crypto.randomUUID()}.png`,
    friendly_name: 'RLS test asset',
    ...overrides
  }
}

async function main() {
  console.log('🔐 session_assets RLS regression test')
  console.log(`   URL: ${supabaseUrl}`)

  // 1. Create a throwaway user with the service role (self-contained setup).
  const email = `rls-test-${Date.now()}@example.com`
  const { data: created, error: createUserError } =
    await admin.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true
    })

  if (createUserError || !created?.user) {
    console.error('❌ Failed to create test user:', createUserError)
    process.exit(1)
  }
  const userId = created.user.id
  console.log(`   Created test user ${userId}`)

  try {
    // 2. Sign in as the test user to obtain an authenticated client.
    const { data: session, error: signInError } =
      await authed.auth.signInWithPassword({ email, password: 'password123' })

    if (signInError || !session?.user) {
      console.error('❌ Failed to sign in as test user:', signInError)
      process.exit(1)
    }

    console.log('\n1. Anonymous (unauthenticated) access')
    // A row must exist for the anon SELECT check to be meaningful.
    const { data: seeded, error: seedError } = await admin
      .from('session_assets')
      .insert([row({ gm_id: userId })])
      .select()
      .single()

    if (seedError || !seeded) {
      console.error('❌ Failed to seed asset row:', seedError)
      process.exit(1)
    }
    const ownedId = seeded.id

    const { error: anonSelectError } = await anon
      .from('session_assets')
      .select('*')
      .eq('id', ownedId)
    assert(!anonSelectError, 'anon SELECT is allowed (public read for player screens)')

    const { error: anonInsertError } = await anon
      .from('session_assets')
      .insert([row()])
      .select()
    assert(anonInsertError !== null, 'anon INSERT is blocked by RLS')

    const { error: anonUpdateError } = await anon
      .from('session_assets')
      .update({ friendly_name: 'hacked' })
      .eq('id', ownedId)
    assert(anonUpdateError !== null, 'anon UPDATE is blocked by RLS')

    const { error: anonDeleteError } = await anon
      .from('session_assets')
      .delete()
      .eq('id', ownedId)
    assert(anonDeleteError !== null, 'anon DELETE is blocked by RLS')

    console.log('\n2. Authenticated owner access (upload/delete flow)')
    const { data: insertedOwn, error: ownInsertError } = await authed
      .from('session_assets')
      .insert([row({ gm_id: userId })])
      .select()
      .single()
    assert(
      !ownInsertError && insertedOwn?.id,
      'owner INSERT with gm_id = auth.uid() succeeds'
    )
    const ownRowId = insertedOwn?.id

    const { error: ownUpdateError } = await authed
      .from('session_assets')
      .update({ friendly_name: 'updated by owner' })
      .eq('id', ownRowId)
    assert(!ownUpdateError, 'owner UPDATE on own row succeeds')

    const { error: ownDeleteError } = await authed
      .from('session_assets')
      .delete()
      .eq('id', ownRowId)
    assert(!ownDeleteError, 'owner DELETE on own row succeeds')

    console.log('\n3. Ownership enforcement')
    const { error: foreignInsertError } = await authed
      .from('session_assets')
      .insert([row({ gm_id: crypto.randomUUID() })])
      .select()
    assert(
      foreignInsertError !== null,
      'authenticated INSERT with a foreign gm_id is blocked by RLS'
    )

    // Seed a row owned by someone else, then try to modify it.
    const { data: foreignRow, error: foreignSeedError } = await admin
      .from('session_assets')
      .insert([row({ gm_id: crypto.randomUUID() })])
      .select()
      .single()
    if (foreignSeedError || !foreignRow) {
      console.error('❌ Failed to seed foreign-owned asset row:', foreignSeedError)
      process.exit(1)
    }

    const { error: foreignUpdateError } = await authed
      .from('session_assets')
      .update({ friendly_name: 'stolen' })
      .eq('id', foreignRow.id)
    assert(
      foreignUpdateError !== null,
      "authenticated UPDATE on another owner's row is blocked"
    )

    const { error: foreignDeleteError } = await authed
      .from('session_assets')
      .delete()
      .eq('id', foreignRow.id)
    assert(
      foreignDeleteError !== null,
      "authenticated DELETE on another owner's row is blocked"
    )
  } finally {
    // Clean up all rows created by this run regardless of outcome.
    const { error: cleanupError } = await admin
      .from('session_assets')
      .delete()
      .like('storage_path', `${testTag}%`)

    if (cleanupError) {
      console.error('⚠️  Cleanup of test rows failed:', cleanupError)
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId)
    if (deleteUserError) {
      console.error('⚠️  Cleanup of test user failed:', deleteUserError)
    }
  }

  console.log(`\n🏁 ${passed} passed, ${failures} failed`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('❌ Unexpected test failure:', err)
  process.exit(1)
})
