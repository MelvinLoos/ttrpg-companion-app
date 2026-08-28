import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client: SupabaseClient<Database> | null = null
let initError: string | null = null
let connectionStatus: 'unknown' | 'ok' | 'unreachable' | 'timeout' = 'unknown'
let connectionError: string | null = null

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return false
  return (
    value === 'your-supabase-project-url' ||
    value === 'your-supabase-anon-key' ||
    value.startsWith('your-')
  )
}

function validateUrlFormat(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: `VITE_SUPABASE_URL must use https:// (got ${parsed.protocol})` }
    }
    if (!parsed.hostname.endsWith('.supabase.co')) {
      return {
        valid: false,
        error: `VITE_SUPABASE_URL must point to a *.supabase.co project (got ${parsed.hostname})`
      }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: `VITE_SUPABASE_URL is not a valid URL (got ${url})` }
  }
}

if (!supabaseUrl || isPlaceholder(supabaseUrl)) {
  initError = `Missing or invalid VITE_SUPABASE_URL. 
  Please create a .env file with your Supabase credentials. 
  Copy .env.example to .env and fill in the real values.`
  console.error(`❌ [Supabase] ${initError.replace(/\n\s+/g, ' ')}`)
} else if (!supabaseAnonKey || isPlaceholder(supabaseAnonKey)) {
  initError = `Missing or invalid VITE_SUPABASE_ANON_KEY. 
  Please create a .env file with your Supabase credentials. 
  Copy .env.example to .env and fill in the real values.`
  console.error(`❌ [Supabase] ${initError.replace(/\n\s+/g, ' ')}`)
} else {
  const urlCheck = validateUrlFormat(supabaseUrl)
  if (!urlCheck.valid) {
    initError = urlCheck.error ?? 'Invalid VITE_SUPABASE_URL format.'
    console.error(`❌ [Supabase] ${initError}`)
  } else {
    try {
      client = createClient<Database>(supabaseUrl, supabaseAnonKey)
      console.log('✅ [Supabase] Client initialized successfully')
    } catch (e) {
      initError = e instanceof Error ? e.message : 'Failed to initialize Supabase client'
      console.error('❌ [Supabase] Initialization error:', e)
    }
  }
}

/**
 * Ping the Supabase REST endpoint to verify the project is reachable.
 * This catches paused/deleted projects that fail with ERR_NAME_NOT_RESOLVED
 * or network timeouts before the app starts making real queries.
 */
export async function checkSupabaseConnection(
  timeoutMs = 8000
): Promise<{ status: typeof connectionStatus; error: string | null }> {
  if (!client || initError) {
    connectionStatus = 'unreachable'
    connectionError = initError ?? 'Supabase client is not initialized'
    return { status: connectionStatus, error: connectionError }
  }

  const url = `${supabaseUrl}/rest/v1/`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    console.log(`🌐 [Supabase] Checking connectivity to ${supabaseUrl}...`)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`
      },
      signal: controller.signal
    })

    clearTimeout(timer)

    if (response.ok || response.status === 401 || response.status === 403) {
      // 401/403 means the project is reachable but the key is wrong — still "ok" network-wise.
      connectionStatus = 'ok'
      connectionError = null
      console.log(`✅ [Supabase] Project is reachable (HTTP ${response.status})`)
    } else {
      connectionStatus = 'unreachable'
      connectionError = `Supabase returned HTTP ${response.status}`
      console.error(`❌ [Supabase] ${connectionError}`)
    }
  } catch (e) {
    clearTimeout(timer)
    connectionStatus = 'timeout'
    connectionError = e instanceof Error ? e.message : 'Network request failed'
    console.error(`❌ [Supabase] Connectivity check failed: ${connectionError}`)
  }

  return { status: connectionStatus, error: connectionError }
}

/**
 * Returns the result of the most recent connectivity check.
 */
export function getSupabaseConnectionStatus(): {
  status: typeof connectionStatus
  error: string | null
} {
  return { status: connectionStatus, error: connectionError }
}

/**
 * Supabase client instance.
 *
 * **Will be `null` if environment variables are missing or invalid.**
 * Always check for this before using. Components should handle the null
 * case by showing an appropriate error UI.
 */
export const supabase = client as SupabaseClient<Database>

/**
 * Whether the Supabase client failed to initialize.
 * Components can check this to decide whether to show an error UI.
 */
export function getSupabaseInitError(): string | null {
  return initError
}

/**
 * Returns true if the Supabase client is properly initialized and ready to use.
 */
export function isSupabaseReady(): boolean {
  return client !== null && initError === null
}
