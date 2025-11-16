import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameSession, SessionState } from '../types/session'
import { supabase } from '../plugins/supabase'

export function mapSession(raw: any): GameSession {
  return {
    id: raw.id,
    gm_id: raw.gm_id ?? '',
    name: raw.name ?? '',
    showing: raw.showing === 'combat' ? 'combat' : 'lobby',
    state: raw.state ?? 'LOBBY',
    active_image_url: raw.active_image_url ?? null,
    current_image_asset_id: raw.current_image_asset_id ?? null,
    teaser_text: raw.teaser_text ?? null,
    active_turn_character_id: raw.active_turn_character_id ?? null,
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? ''
  }
}

export const useSessionStore = defineStore('session', () => {
  // State
  const state = ref<SessionState>({
    sessions: [],
    currentSession: null,
    characters: {},
    loading: false,
    error: null
  })

  // Getters
  const activeSessions = computed(() => 
    state.value.sessions.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    })
  )

  const currentCharacters = computed(() => 
    state.value.currentSession
      ? state.value.characters[state.value.currentSession.id] || []
      : []
  )

  // Actions
  async function fetchSessions() {
    state.value.loading = true
    state.value.error = null
    
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      state.value.sessions = (data || []).map(mapSession)
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to fetch sessions'
    } finally {
      state.value.loading = false
    }
  }

  async function createSession(name: string, teaserText?: string, activeImageUrl?: string | null) {
    state.value.loading = true
    state.value.error = null
    
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('sessions')
        .insert([{ 
          name, 
          teaser_text: teaserText,
          active_image_url: activeImageUrl,
          showing: 'lobby',
          gm_id: session.user.id
        }])
        .select()
        .single()

      if (error) throw error

      state.value.sessions = [...state.value.sessions, mapSession(data)]
      return data
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to create session'
      return null
    } finally {
      state.value.loading = false
    }
  }

  async function updateSession(id: string, updates: Partial<GameSession>) {
    state.value.loading = true
    state.value.error = null
    
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      state.value.sessions = state.value.sessions.map(s => 
        s.id === id ? mapSession({ ...s, ...data }) : s
      )
      if (state.value.currentSession?.id === id) {
        state.value.currentSession = mapSession({ ...state.value.currentSession, ...data })
      }

      return data
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to update session'
      return null
    } finally {
      state.value.loading = false
    }
  }

  async function deleteSession(id: string) {
    state.value.loading = true
    state.value.error = null
    
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)

      if (error) throw error

      state.value.sessions = state.value.sessions.filter(s => s.id !== id)
      if (state.value.currentSession?.id === id) {
        state.value.currentSession = null
      }
      delete state.value.characters[id]
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to delete session'
    } finally {
      state.value.loading = false
    }
  }

  async function setCurrentSession(id: string | null) {
    if (!id) {
      state.value.currentSession = null
      return
    }

    const session = state.value.sessions.find(s => s.id === id)
    if (session) {
      state.value.currentSession = session
      await fetchSessionCharacters(id)
    }
  }

  async function fetchSessionCharacters(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('session_characters')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at')

      if (error) throw error

      state.value.characters[sessionId] = data
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to fetch characters'
    }
  }

  // Initialize real-time subscriptions
  function subscribeToChanges() {
    const sessionsSubscription = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes' as const,
        { event: '*', schema: 'public', table: 'sessions' },
        (payload) => {
          if (!payload.new && !payload.old) return;
          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new) {
                state.value.sessions = [...state.value.sessions, mapSession(payload.new)];
              }
              break;
            case 'UPDATE':
              if (payload.new) {
                const updated = mapSession(payload.new);
                state.value.sessions = state.value.sessions.map(s =>
                  s.id === updated.id ? updated : s
                );
                if (state.value.currentSession?.id === updated.id) {
                  state.value.currentSession = updated;
                }
              }
              break;
            case 'DELETE':
              if (payload.old?.id) {
                state.value.sessions = state.value.sessions.filter(s => s.id !== payload.old.id);
                if (state.value.currentSession?.id === payload.old.id) {
                  state.value.currentSession = null;
                }
              }
              break;
          }
        }
      )
      .subscribe();

    // Note: Removed session_characters subscription to avoid conflicts with PartyBar
    // The PartyBar component handles its own character subscriptions with proper filtering

    return () => {
      sessionsSubscription.unsubscribe()
    }
  }

  return {
    // State
    state,
    // Getters
    activeSessions,
    currentCharacters,
    // Actions
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    setCurrentSession,
    fetchSessionCharacters,
    subscribeToChanges
  }
})