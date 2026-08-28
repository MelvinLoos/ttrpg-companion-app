<script setup lang="ts">
import { ref, computed, onErrorCaptured } from 'vue'
import { getSupabaseInitError } from '../plugins/supabase'

const props = defineProps<{
  /** Optional custom error message to display */
  message?: string
  /** Whether to show technical details */
  showDetails?: boolean
}>()

const hasChildError = ref(false)
const childError = ref<string | null>(null)
const detailsExpanded = ref(false)

// Capture errors from child components (error boundary behavior)
onErrorCaptured((err, instance, info) => {
  console.error('[AppError] Captured error from child:', err)
  console.error('[AppError] Component:', instance)
  console.error('[AppError] Error info:', info)

  childError.value = err instanceof Error ? err.message : String(err)
  hasChildError.value = true

  // Prevent the error from propagating further
  return false
})

const displayError = computed(() => {
  if (props.message) return props.message
  if (childError.value) return childError.value

  // Check for Supabase init error
  const supabaseError = getSupabaseInitError()
  if (supabaseError) return supabaseError

  return null
})

// Only show when there's actually an error
const hasError = computed(() => {
  return displayError.value !== null && displayError.value.length > 0
})

const isSupabaseConfigError = computed(() => {
  const msg = displayError.value ?? ''
  return (
    msg.includes('VITE_SUPABASE') ||
    msg.includes('.env') ||
    msg.includes('Supabase credentials') ||
    msg.includes('Missing or invalid')
  )
})

function refreshPage() {
  window.location.reload()
}
</script>

<template>
  <div v-if="hasError" class="app-error">
    <div class="app-error-card">
      <!-- Icon -->
      <div class="app-error-icon">⚠️</div>

      <!-- Title -->
      <h1 class="app-error-title">
        <template v-if="isSupabaseConfigError">
          Missing Configuration
        </template>
        <template v-else>
          Something Went Wrong
        </template>
      </h1>

      <!-- Description -->
      <div class="app-error-description">
        <template v-if="isSupabaseConfigError">
          <p>The application couldn't connect to the backend because required
          environment variables are missing or contain placeholder values.</p>
          <h3>How to fix this:</h3>
          <ol>
            <li>Copy the example environment file:<br/>
              <code>cp .env.example .env</code>
            </li>
            <li>Open <code>.env</code> and replace the placeholder values with your
            real Supabase credentials.</li>
            <li>You can find your credentials at:<br/>
              <a
                href="https://app.supabase.com/project/_/settings/api"
                target="_blank"
                rel="noopener noreferrer"
              >https://app.supabase.com/project/_/settings/api</a>
            </li>
            <li>Restart the dev server.</li>
          </ol>
        </template>
        <template v-else>
          <p>An unexpected error occurred while running the application.</p>
          <p v-if="displayError" class="app-error-message">
            {{ displayError }}
          </p>
        </template>
      </div>

      <!-- Technical Details (expandable) -->
      <div v-if="props.showDetails !== false" class="app-error-details">
        <button
          class="app-error-details-toggle"
          @click="detailsExpanded = !detailsExpanded"
        >
          {{ detailsExpanded ? '▼' : '▶' }} Technical Details
        </button>
        <div v-if="detailsExpanded" class="app-error-details-content">
          <pre><code>{{ displayError }}</code></pre>
          <p class="app-error-details-hint">
            Check the browser console (F12 > Console) for more details.
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="app-error-actions">
        <button class="app-error-btn app-error-btn-primary" @click="refreshPage">
          Refresh Page
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-error {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a2e;
  color: rgba(255, 255, 255, 0.87);
  padding: 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.app-error-card {
  max-width: 600px;
  width: 100%;
  background: #16213e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.app-error-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.app-error-title {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin: 0 0 1rem;
  color: #e94560;
}

.app-error-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
}

.app-error-description h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
  color: rgba(255, 255, 255, 0.9);
}

.app-error-description ol {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
}

.app-error-description li {
  margin-bottom: 0.5rem;
}

.app-error-description code {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.85rem;
}

.app-error-description a {
  color: #0f3460;
  text-decoration: underline;
  word-break: break-all;
}

.app-error-message {
  background: rgba(233, 69, 96, 0.1);
  border-left: 3px solid #e94560;
  padding: 0.75rem 1rem;
  border-radius: 0 6px 6px 0;
  margin-top: 0.75rem;
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.85rem;
  color: #e94560;
  word-break: break-word;
}

.app-error-details {
  margin-top: 1.25rem;
}

.app-error-details-toggle {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.25rem 0;
  font-family: inherit;
}

.app-error-details-toggle:hover {
  color: rgba(255, 255, 255, 0.8);
}

.app-error-details-content {
  margin-top: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
}

.app-error-details-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.app-error-details-hint {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}

.app-error-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.app-error-btn {
  padding: 0.625rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: background-color 0.15s ease;
}

.app-error-btn-primary {
  background: #0f3460;
  color: #fff;
}

.app-error-btn-primary:hover {
  background: #1a4a8a;
}

.app-error-btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.app-error-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>