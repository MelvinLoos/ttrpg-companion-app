import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from './plugins/router'
import App from './App.vue'
import { getSupabaseInitError } from './plugins/supabase'

import './assets/style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

/**
 * Global error handler — catches unhandled Vue errors (component render errors,
 * watcher errors, lifecycle hook errors) and prevents the white screen of death.
 *
 * Errors are logged to the console with full context, while the App.vue error
 * boundary (onErrorCaptured) displays a user-friendly error UI.
 */
app.config.errorHandler = (err, instance, info) => {
  const errorMessage = err instanceof Error ? err.message : String(err)

  console.group('%c❌ Application Error', 'color: #e94560; font-size: 1.1em;')
  console.error('Message:', errorMessage)

  if (instance) {
    console.error('Component:', instance.$.type?.__name || instance.$.type || 'Unknown')
  }

  console.error('Info:', info)

  if (err instanceof Error && err.stack) {
    console.error('Stack trace:\n', err.stack)
  }

  console.groupEnd()
}

// Catch unhandled promise rejections globally
window.addEventListener('unhandledrejection', (event) => {
  console.group('%c⚠️ Unhandled Promise Rejection', 'color: #ff9800; font-size: 1.1em;')
  console.error('Reason:', event.reason)
  console.groupEnd()

  // Prevent default browser console behavior
  event.preventDefault()
})

// In development, unregister any stale service workers left over from earlier
// deployments or PWA experiments. This removes confusing Workbox warnings like
// "The navigation route /gm is not being used..." and makes the behavior visible.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      if (registrations.length === 0) return
      console.log(
        `%c🧹 [Dev] Unregistering ${registrations.length} stale service worker(s)...`,
        'color: #4caf50; font-size: 1.05em;'
      )
      return Promise.all(
        registrations.map((registration) => {
          const scope = registration.scope || '(unknown scope)'
          console.log(`   → Unregistering service worker: ${scope}`)
          return registration.unregister()
        })
      )
    })
    .then((results) => {
      if (results && results.length > 0) {
        console.log(
          `%c✅ [Dev] ${results.filter(Boolean).length} stale service worker(s) unregistered. Refresh if Workbox warnings persist.`,
          'color: #4caf50;'
        )
      }
    })
    .catch((err) => {
      console.error('❌ [Dev] Failed to unregister service workers:', err)
    })
}

app.mount('#app')

// Log early Supabase init error to console if present
const supabaseError = getSupabaseInitError()
if (supabaseError) {
  console.warn(
    '%c⚠️ Supabase client not available — the app will show an error UI.',
    'color: #ff9800; font-size: 1.1em;'
  )
  console.warn(supabaseError)
}
