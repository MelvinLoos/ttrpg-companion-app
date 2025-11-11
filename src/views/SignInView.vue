<template>
  <div class="sign-in">
    <div class="sign-in-container">
      <h1>Sign In</h1>
      <form @submit.prevent="handleSubmit">
        <div class="form-group" :class="{ error: error }">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
            :disabled="loading"
          />
        </div>
        <div class="form-group" :class="{ error: error }">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Enter your password"
            :disabled="loading"
          />
        </div>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

// Redirect if already authenticated
onMounted(() => {
  if (authStore.isAuthenticated) {
    const redirect = route.query.redirect as string || '/gm'
    router.push(redirect)
  }
})

async function handleSubmit() {
  loading.value = true
  error.value = null

  try {
    const success = await authStore.signIn(email.value, password.value)
    if (success) {
      // Redirect to the intended page or default to /gm
      const redirect = route.query.redirect as string || '/gm'
      router.push(redirect)
    }
  } catch (e) {
    error.value = 'Failed to sign in. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.sign-in {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.sign-in-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

h1 {
  margin: 0 0 2rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  font-size: 1rem;
}

.form-group.error input {
  border-color: rgba(255, 0, 0, 0.5);
}

.error-message {
  color: rgba(255, 0, 0, 0.8);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.25rem;
  background: rgba(59, 130, 246, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.8);
  color: inherit;
  font-size: 1rem;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.7);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>