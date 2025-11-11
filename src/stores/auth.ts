import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../plugins/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  async function initialize() {
    try {
      loading.value = true
      
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null

      // Listen for auth changes (this handles automatic session refresh)
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        user.value = session?.user ?? null
        
        // Clear any existing errors when auth state changes
        if (session?.user) {
          error.value = null
        }
      })
    } catch (e) {
      console.error('Auth initialization failed:', e)
      error.value = e instanceof Error ? e.message : 'Failed to initialize auth'
    } finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string) {
    try {
      loading.value = true
      error.value = null
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (err) throw err
      user.value = data.user
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to sign in'
      return false
    } finally {
      loading.value = false
    }
    return true
  }

  async function signOut() {
    try {
      loading.value = true
      error.value = null
      const { error: err } = await supabase.auth.signOut()
      if (err) throw err
      user.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to sign out'
      return false
    } finally {
      loading.value = false
    }
    return true
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    initialize,
    signIn,
    signOut
  }
})