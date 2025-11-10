import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PremadeCharacter, CharacterState } from '../types/character'
import { supabase } from '../plugins/supabase'

export const useCharacterStore = defineStore('character', () => {
  // State
  const state = ref<CharacterState>({
    premadeCharacters: [],
    loading: false,
    error: null
  })

  // Getters
  const sortedCharacters = computed(() => 
    [...state.value.premadeCharacters].sort((a, b) => a.name.localeCompare(b.name))
  )

  // Actions
  async function fetchPremadeCharacters() {
    state.value.loading = true
    state.value.error = null

    try {
      const { data, error } = await supabase
        .from('premade_characters')
        .select('*')
        .order('name')

      if (error) throw error
      state.value.premadeCharacters = data
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to fetch characters'
    } finally {
      state.value.loading = false
    }
  }

  async function uploadPortrait(file: File, characterName?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('portraits')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get the public URL
      const { data } = supabase.storage
        .from('portraits')
        .getPublicUrl(fileName)

      // Also create an entry in session_assets so it appears in the Assets view
      try {
        await supabase
          .from('session_assets')
          .insert([{
            gm_id: user.id,
            asset_type: 'portrait',
            storage_bucket: 'portraits',
            storage_path: fileName,
            public_url: data.publicUrl,
            friendly_name: characterName ? `${characterName} Portrait` : file.name
          }])
      } catch (assetError) {
        // Don't fail the whole operation if asset tracking fails
        console.warn('Failed to track portrait in assets:', assetError)
      }

      return data.publicUrl
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to upload portrait')
    }
  }

  async function createCharacter(character: Omit<PremadeCharacter, 'id' | 'gm_id' | 'portrait_url' | 'created_at' | 'updated_at'>, portrait?: File) {
    state.value.loading = true
    state.value.error = null

    try {
      let portrait_url = null
      if (portrait) {
        portrait_url = await uploadPortrait(portrait, character.name)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('premade_characters')
        .insert([{ ...character, portrait_url, gm_id: user.id }])
        .select()
        .single()

      if (error) throw error

      state.value.premadeCharacters = [...state.value.premadeCharacters, data]
      return data
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to create character'
      return null
    } finally {
      state.value.loading = false
    }
  }

  async function updateCharacter(id: string, updates: Partial<PremadeCharacter>, portrait?: File) {
    state.value.loading = true
    state.value.error = null

    try {
      let portrait_url = updates.portrait_url
      if (portrait) {
        portrait_url = await uploadPortrait(portrait, updates.name || 'Character')
      }

      const { data, error } = await supabase
        .from('premade_characters')
        .update({ ...updates, portrait_url })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      state.value.premadeCharacters = state.value.premadeCharacters.map((c: PremadeCharacter) =>
        c.id === id ? { ...c, ...data } : c
      )
      return data
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to update character'
      return null
    } finally {
      state.value.loading = false
    }
  }

  async function deleteCharacter(id: string) {
    state.value.loading = true
    state.value.error = null

    try {
      const { error } = await supabase
        .from('premade_characters')
        .delete()
        .eq('id', id)

      if (error) throw error

      state.value.premadeCharacters = state.value.premadeCharacters.filter((c: PremadeCharacter) => c.id !== id)
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Failed to delete character'
      throw error
    } finally {
      state.value.loading = false
    }
  }

  // Initialize real-time subscriptions
  function subscribeToChanges() {
    const subscription = supabase
      .channel('premade-characters-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'premade_characters' },
        (payload) => {
          if (!payload.new && !payload.old) return

          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new) {
                state.value.premadeCharacters = [...state.value.premadeCharacters, payload.new as PremadeCharacter]
              }
              break
            case 'UPDATE':
              if (payload.new) {
                const updated = payload.new as PremadeCharacter
                state.value.premadeCharacters = state.value.premadeCharacters.map((c: PremadeCharacter) =>
                  c.id === updated.id ? updated : c
                )
              }
              break
            case 'DELETE':
              if (payload.old) {
                state.value.premadeCharacters = state.value.premadeCharacters.filter((c: PremadeCharacter) =>
                  c.id !== payload.old.id
                )
              }
              break
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  return {
    state,
    sortedCharacters,
    fetchPremadeCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    subscribeToChanges
  }
})