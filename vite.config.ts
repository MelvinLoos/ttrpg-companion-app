import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import dns from 'node:dns'
import { promisify } from 'node:util'

const dnsLookup = promisify(dns.lookup)

/**
 * Vite plugin that validates required environment variables at dev-server
 * startup and build time. Prevents the "white screen of death" caused by
 * missing .env files or placeholder values, and warns when the configured
 * Supabase project is unreachable (paused/deleted/wrong URL).
 */
function validateEnvPlugin(): Plugin {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ] as const

  const placeholderPatterns = [
    /your-supabase-project-url/i,
    /your-supabase-anon-key/i,
    /your-/i,
  ]

  function loadEnvFile(): Record<string, string> {
    const envFile = resolve(process.cwd(), '.env')
    if (!existsSync(envFile)) {
      return {}
    }

    const raw = readFileSync(envFile, 'utf-8')
    const result: Record<string, string> = {}

    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      let value = trimmed.slice(eqIndex + 1).trim()
      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      result[key] = value
    }

    return result
  }

  function validate(): void {
    const envFileVars = loadEnvFile()
    const missing: string[] = []
    const isPlaceholder: string[] = []

    for (const varName of requiredVars) {
      const fromEnvFile = envFileVars[varName]
      const fromProcess = process.env[varName]

      const value = fromEnvFile ?? fromProcess

      if (!value || value.length === 0) {
        missing.push(varName)
        continue
      }

      if (placeholderPatterns.some((p) => p.test(value))) {
        isPlaceholder.push(varName)
      }
    }

    const errors: string[] = []

    if (missing.length > 0) {
      errors.push(
        `\n  Missing environment variables:\n    ${missing
          .map((v) => `- ${v}`)
          .join('\n    ')}\n\n  → Copy .env.example to .env and fill in your Supabase credentials.`
      )
    }

    if (isPlaceholder.length > 0) {
      errors.push(
        `\n  Placeholder values detected for:\n    ${isPlaceholder
          .map((v) => `- ${v}`)
          .join('\n    ')}\n\n  → Replace the placeholder values in your .env file with real credentials.`
      )
    }

    if (!existsSync(resolve(process.cwd(), '.env'))) {
      errors.push(
        `\n  No .env file found!\n\n  → Run: cp .env.example .env\n  → Then edit .env with your Supabase credentials.`
      )
    }

    if (errors.length === 0) return

    const divider = '═'.repeat(72)
    console.error(
      `\n${divider}\n` +
      `  ❌  MISSING OR INVALID SUPABASE CREDENTIALS\n` +
      `${divider}\n` +
      errors.join('\n') +
      `\n\n  Get your credentials from: https://app.supabase.com/project/_/settings/api\n` +
      `${divider}\n`
    )
  }

  return {
    name: 'validate-env',
    buildStart() {
      validate()
    },
    configureServer(server) {
      // Validate immediately on dev server start
      validate()
      // Re-validate on server restart
      server.watcher.add(resolve(process.cwd(), '.env'))
      server.watcher.on('change', (file) => {
        if (file === resolve(process.cwd(), '.env')) {
          validate()
        }
      })
    },
  }
}

/**
 * Vite plugin that warns when the configured Supabase project URL does not
 * resolve (paused/deleted project) or returns an unexpected response. Runs
 * asynchronously so it does not block dev server startup.
 */
function supabaseReachabilityPlugin(): Plugin {
  async function checkReachability(): Promise<void> {
    const envFileVars = (() => {
      const envFile = resolve(process.cwd(), '.env')
      if (!existsSync(envFile)) return {}
      const result: Record<string, string> = {}
      for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIndex = trimmed.indexOf('=')
        if (eqIndex === -1) continue
        const key = trimmed.slice(0, eqIndex).trim()
        let value = trimmed.slice(eqIndex + 1).trim()
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        result[key] = value
      }
      return result
    })()

    const url = envFileVars['VITE_SUPABASE_URL'] ?? process.env['VITE_SUPABASE_URL']
    if (!url || url.includes('your-')) return

    let hostname: string | undefined
    try {
      hostname = new URL(url).hostname
    } catch {
      console.error(`\n❌ [Supabase Reachability] VITE_SUPABASE_URL is not a valid URL: ${url}\n`)
      return
    }

    if (!hostname.endsWith('.supabase.co')) {
      console.warn(
        `\n⚠️ [Supabase Reachability] VITE_SUPABASE_URL does not look like a Supabase project: ${url}\n`
      )
      return
    }

    try {
      await dnsLookup(hostname)
      // DNS resolves — project likely exists. We do not make an HTTP request here
      // because the browser-side check in supabase.ts will handle that.
      console.log(`✅ [Supabase Reachability] DNS resolves for ${hostname}`)
    } catch {
      const divider = '═'.repeat(72)
      console.error(
        `\n${divider}\n` +
        `  ❌  SUPABASE PROJECT UNREACHABLE\n` +
        `${divider}\n` +
        `  DNS lookup failed for: ${hostname}\n` +
        `  This usually means the project is paused, deleted, or the URL is wrong.\n\n` +
        `  → Open https://app.supabase.com and verify your project is active.\n` +
        `  → Update VITE_SUPABASE_URL in your .env file.\n` +
        `  → Restart the dev server after updating .env.\n` +
        `${divider}\n`
      )
    }
  }

  return {
    name: 'supabase-reachability',
    configureServer() {
      checkReachability().catch(() => {
        // Swallow plugin errors so they don't crash the dev server.
      })
    },
    buildStart() {
      checkReachability().catch(() => {
        // Swallow plugin errors so they don't crash the build.
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    validateEnvPlugin(),
    supabaseReachabilityPlugin(),
    vue(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    strictPort: true
  },
  base: '/'
})
