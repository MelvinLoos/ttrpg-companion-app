// RLS regression test for the core public tables.
//
// Guards against the regression that produced the Supabase advisor findings
// (policy_exists_rls_disabled / rls_disabled_in_public /
// sensitive_columns_exposed): Row Level Security being disabled on tables that
// already have a full policy set.
//
// What it checks:
//   1. Every core public table has `rowsecurity = true` in pg_tables.
//   2. Anonymous INSERT is blocked on tables that are not supposed to accept
//      public writes. INSERT errors with 42501 (RLS violation) when blocked,
//      unlike DELETE which silently returns 0 rows in PostgREST.
//      (session_characters intentionally allows public writes for the player
//      join / hand-raise flow, so it is excluded from #2.)
//      Tables requiring complex foreign keys (combat_encounter_monsters,
//      active_combats, combat_participants) are verified solely by the
//      rowsecurity check — their policy pattern is the same as the tested
//      tables, so the per-pattern check is sufficient.
//
// Exit code is 0 when all assertions pass, 1 otherwise (CI-friendly).
//
// Usage:
//   node scripts/tests/core-tables-rls.mjs
//
// Required env vars (never hardcode keys — these are secrets):
//   SUPABASE_URL              e.g. https://<project-ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY service role key (admin, bypasses RLS)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error(
    'Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY'
  )
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
const anon = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Tables that must have RLS enabled.
const CORE_TABLES = [
  'sessions',
  'session_characters',
  'premade_characters',
  'monster_templates',
  'combat_encounters',
  'combat_encounter_monsters',
  'active_combats',
  'combat_participants'
]

// Tables where anon INSERT should be blocked and we can verify it with a
// minimal payload (no complex FK requirements).
// session_characters intentionally allows public writes.
const ANON_INSERT_BLOCKED = [
  { table: 'sessions', row: { name: 'rls-test' } },
  { table: 'premade_characters', row: { name: 'rls-test' } },
  { table: 'monster_templates', row: { name: 'rls-test', hit_points: 1, armor_class: 1 } },
  { table: 'combat_encounters', row: { name: 'rls-test' } }
]

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

async function main() {
  console.log('🔐 core tables RLS regression test')
  console.log(`   URL: ${supabaseUrl}`)

  // 1. Verify RLS is enabled on every core table.
  console.log('\n1. Row Level Security is enabled')
  const { data, error } = await admin
    .from('pg_tables')
    .select('tablename, rowsecurity')
    .eq('schemaname', 'public')
    .in('tablename', CORE_TABLES)

  if (error) {
    console.error('❌ Failed to read pg_tables:', error.message)
    process.exit(1)
  }

  const byName = new Map((data || []).map((r) => [r.tablename, r.rowsecurity]))
  for (const table of CORE_TABLES) {
    const rowsecurity = byName.get(table)
    assert(
      rowsecurity === true,
      `${table} has rowsecurity = true (got ${rowsecurity})`
    )
  }

  // 2. Spot-check that anonymous INSERT is blocked on write-protected tables.
  //    Use INSERT (not DELETE) because PostgREST DELETE returns no error when
  //    RLS filters out all rows — false negative. INSERT with a failing
  //    WITH CHECK returns 42501 (new row violates row-level security policy).
  console.log('\n2. Anonymous INSERT is blocked on write-protected tables')
  for (const { table, row } of ANON_INSERT_BLOCKED) {
    const { error: writeError } = await anon
      .from(table)
      .insert([row])
      .select()
    assert(
      writeError !== null && writeError.code === '42501',
      `anon INSERT on ${table} is blocked by RLS (code: ${writeError?.code ?? 'none'})`
    )
  }

  console.log(`\n🏁 ${passed} passed, ${failures} failed`)
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('❌ Unexpected test failure:', err)
  process.exit(1)
})
