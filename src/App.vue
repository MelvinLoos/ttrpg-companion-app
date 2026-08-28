<script setup lang="ts">
import { ref, onErrorCaptured, onMounted, computed } from 'vue'
import { useAuthStore } from './stores/auth'
import {
  getSupabaseInitError,
  isSupabaseReady,
  checkSupabaseConnection,
  getSupabaseConnectionStatus
} from './plugins/supabase'
import AppError from './components/AppError.vue'

const authStore = useAuthStore()

const hasRuntimeError = ref(false)
const runtimeErrorMessage = ref<string | null>(null)
const connectionChecked = ref(false)

// Capture errors from any child component (error boundary)
onErrorCaptured((err, _instance, info) => {
  console.error('[App] Error boundary caught:', err, info)
  hasRuntimeError.value = true
  runtimeErrorMessage.value = err instanceof Error ? err.message : String(err)
  // Return false to prevent the error from propagating further
  return false
})

// Check if the app has a fatal initialization error
const hasFatalInitError = computed(() => {
  return !isSupabaseReady()
})

const initErrorMessage = computed(() => {
  return getSupabaseInitError()
})

const isConnectionError = computed(() => {
  const status = getSupabaseConnectionStatus()
  return status.status === 'unreachable' || status.status === 'timeout'
})

const connectionErrorMessage = computed(() => {
  const status = getSupabaseConnectionStatus()
  if (status.status === 'unreachable' || status.status === 'timeout') {
    return (
      status.error ??
      'Unable to reach the Supabase project. It may be paused, deleted, or the URL in .env may be wrong.'
    )
  }
  return null
})

onMounted(async () => {
  try {
    // Check for Supabase init errors first
    if (!isSupabaseReady()) {
      console.warn('⚠️ Supabase not initialized. Showing error UI.')
      connectionChecked.value = true
      return
    }

    // Verify the project is actually reachable (catches paused/deleted projects)
    await checkSupabaseConnection()
    connectionChecked.value = true

    if (isConnectionError.value) {
      console.warn('⚠️ Supabase project unreachable. Showing error UI.')
      return
    }

    // Auth initialization — can be skipped in dev via VITE_SKIP_AUTH
    const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'
    if (skipAuth) {
      authStore.loading = false
      console.log(
        '%c🔧 Auth initialization bypassed for testing (VITE_SKIP_AUTH=true)',
        'color: #ff9800; font-size: 1.05em;'
      )
    } else {
      await authStore.initialize()
    }
  } catch (e) {
    console.error('App initialization failed:', e)
    hasRuntimeError.value = true
    runtimeErrorMessage.value =
      e instanceof Error ? e.message : 'Failed to initialize application'
  }
})
</script>

<template>
  <!-- Fatal initialization error (e.g., missing .env) -->
  <AppError
    v-if="hasFatalInitError"
    :message="initErrorMessage ?? 'Unable to connect to backend services.'"
  />

  <!-- Supabase project unreachable (paused/deleted/wrong URL) -->
  <AppError
    v-else-if="isConnectionError && connectionChecked"
    :message="connectionErrorMessage ?? 'Unable to connect to backend services.'"
  />

  <!-- Runtime errors caught by error boundary -->
  <AppError
    v-else-if="hasRuntimeError"
    :message="runtimeErrorMessage ?? 'An unexpected error occurred.'"
  />

  <!-- Auth loading state -->
  <div v-else-if="authStore.loading" class="loading-app">
    <div class="loading-spinner"></div>
    <p>Loading...</p>
  </div>

  <!-- Normal app rendering -->
  <router-view v-else />
</template>

<style>
/* Global styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #242424;
  color: rgba(255, 255, 255, 0.87);
}

.loading-app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
