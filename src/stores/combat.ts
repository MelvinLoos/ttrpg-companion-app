import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  MonsterTemplate, 
  CombatEncounter, 
  CombatEncounterWithMonsters,
  ActiveCombat,
  CombatParticipant,
  CombatParticipantWithType,
  ParticipantType
} from '../types/combat'
import { supabase } from '../plugins/supabase'

export const useCombatStore = defineStore('combat', () => {
  // State
  const monsters = ref<MonsterTemplate[]>([])
  const encounters = ref<CombatEncounterWithMonsters[]>([])
  const activeCombat = ref<ActiveCombat | null>(null)
  const participants = ref<CombatParticipantWithType[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const sortedParticipants = computed(() => {
    return [...participants.value].sort((a, b) => {
      // Sort by initiative (descending), then by turn_order
      if (a.initiative !== null && b.initiative !== null) {
        if (a.initiative !== b.initiative) {
          return b.initiative - a.initiative
        }
      }
      // If initiative is the same or null, use turn_order
      return (a.turn_order || 0) - (b.turn_order || 0)
    })
  })

  const currentParticipant = computed(() => {
    if (!activeCombat.value?.current_turn_id) return null
    return participants.value.find((p: any) => p.id === activeCombat.value?.current_turn_id)
  })

  // Helper function to calculate health status
  const getHealthStatus = (current: number, max: number): string => {
    if (current <= 0) return 'Defeated'
    const percentage = (current / max) * 100
    if (percentage >= 100) return 'Unharmed'
    if (percentage >= 50) return 'Injured'
    if (percentage >= 25) return 'Bloodied'
    return 'Near Death'
  }

  const getParticipantType = (participant: CombatParticipant): ParticipantType => {
    return participant.character_id ? 'player' : 'monster'
  }

  const enhanceParticipant = (participant: CombatParticipant): CombatParticipantWithType => {
    const type = getParticipantType(participant)
    let health_status = undefined
    let health_percentage = undefined

    if (type === 'monster' && participant.current_hit_points !== null && participant.max_hit_points !== null) {
      health_percentage = Math.round((participant.current_hit_points / participant.max_hit_points) * 100)
      health_status = getHealthStatus(participant.current_hit_points, participant.max_hit_points) as any
    }

    return {
      ...participant,
      type,
      health_status,
      health_percentage
    }
  }

  // Actions
  const fetchMonsters = async () => {
    try {
      isLoading.value = true
      const { data, error: fetchError } = await supabase
        .from('monster_templates')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError
      monsters.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch monsters'
    } finally {
      isLoading.value = false
    }
  }

  const createMonster = async (monster: Omit<MonsterTemplate, 'id' | 'created_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('monster_templates')
        .insert([monster])
        .select()
        .single()

      if (createError) throw createError
      monsters.value.push(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create monster'
      throw err
    }
  }

  const updateMonster = async (id: string, updates: Partial<MonsterTemplate>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('monster_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      
      const index = monsters.value.findIndex((m: any) => m.id === id)
      if (index >= 0) {
        monsters.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update monster'
      throw err
    }
  }

  const deleteMonster = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('monster_templates')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      
      monsters.value = monsters.value.filter((m: any) => m.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete monster'
      throw err
    }
  }

  const fetchEncounters = async () => {
    try {
      isLoading.value = true
      const { data, error: fetchError } = await supabase
        .from('combat_encounters')
        .select(`
          *,
          monsters:combat_encounter_monsters(
            *,
            monster_template:monster_templates(*)
          )
        `)
        .order('name')

      if (fetchError) throw fetchError
      encounters.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch encounters'
    } finally {
      isLoading.value = false
    }
  }

  const createEncounter = async (encounter: Omit<CombatEncounter, 'id' | 'created_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('combat_encounters')
        .insert([encounter])
        .select()
        .single()

      if (createError) throw createError
      
      const newEncounter: CombatEncounterWithMonsters = {
        ...data,
        monsters: []
      }
      encounters.value.unshift(newEncounter)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create encounter'
      throw err
    }
  }

  // Update Encounter
  const updateEncounter = async (id: string, updates: Partial<CombatEncounter>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('combat_encounters')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      const index = encounters.value.findIndex((e: any) => e.id === id)
      if (index >= 0 && data && encounters.value[index] !== undefined) {
        // Only update name and description, preserve monsters array
        encounters.value[index].name = data.name
        encounters.value[index].description = data.description
        encounters.value[index].created_at = data.created_at
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update encounter'
      throw err
    }
  }

  // Delete Encounter
  const deleteEncounter = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('combat_encounters')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      encounters.value = encounters.value.filter((e: any) => e.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete encounter'
      throw err
    }
  }

  const addMonsterToEncounter = async (encounterId: string, monsterTemplateId: string, quantity: number = 1) => {
    try {
      const { data, error: addError } = await supabase
        .from('combat_encounter_monsters')
        .insert([{
          encounter_id: encounterId,
          monster_template_id: monsterTemplateId,
          quantity
        }])
        .select(`
          *,
          monster_template:monster_templates(*)
        `)
        .single()

      if (addError) throw addError
      
      const encounter = encounters.value.find((e: any) => e.id === encounterId)
      if (encounter) {
        encounter.monsters.push(data)
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add monster to encounter'
      throw err
    }
  }

  // Remove monster from encounter
  const removeMonsterFromEncounter = async (encounterMonsterId: string, encounterId?: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('combat_encounter_monsters')
        .delete()
        .eq('id', encounterMonsterId)

      if (deleteError) throw deleteError
      // Remove from local state
      if (encounterId) {
        const encounter = encounters.value.find((e: any) => e.id === encounterId)
        if (encounter) {
          encounter.monsters = encounter.monsters.filter((em: any) => em.id !== encounterMonsterId)
        }
      } else {
        // Fallback: update all encounters
        encounters.value.forEach((encounter: any) => {
          encounter.monsters = encounter.monsters.filter((em: any) => em.id !== encounterMonsterId)
        })
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove monster from encounter'
      throw err
    }
  }

  const startCombat = async (sessionId: string, encounterId: string) => {
    try {
      isLoading.value = true
      
      // Create active combat
      let combat
      const { data: combatData, error: combatError } = await supabase
        .from('active_combats')
        .insert([{
          session_id: sessionId,
          encounter_id: encounterId
        }])
        .select()
        .single()

      if (combatError) {
        // Check if it's a unique constraint violation
        if (combatError.code === '23505') {
          console.log('Unique constraint violation detected')
          
          // The unique constraint should only apply to active combats
          // If we're getting this error, it means there's still an active combat
          // Let's be more specific about what we find
          
          const { data: activeCombats, error: checkError } = await supabase
            .from('active_combats')
            .select('*')
            .eq('session_id', sessionId)
            .is('ended_at', null)

          if (checkError) {
            console.error('Error checking for active combats:', checkError)
            throw new Error('Unable to check for existing active combats')
          }

          const activeCount = activeCombats?.length || 0
          console.log(`Found ${activeCount} active combats`)

          if (activeCount > 0) {
            // There are genuinely active combats
            console.log('Active combats found:', activeCombats)
            throw new Error(`There ${activeCount === 1 ? 'is' : 'are'} ${activeCount} active combat${activeCount === 1 ? '' : 's'} in progress. Please end the current combat before starting a new one.`)
          } else {
            // No active combats, but still getting constraint violation
            // This means the constraint is wrong - it should only apply to active combats
            throw new Error('Database constraint error: The active_combats table has an incorrect unique constraint that prevents creating new combats even when no active combats exist. Please apply the database migration to fix this.')
          }
        } else {
          throw combatError
        }
      } else {
        combat = combatData
      }

      if (!combat) {
        throw new Error('Failed to create or retrieve combat data')
      }

      activeCombat.value = combat as any
      
      // Get session characters
      const { data: characters, error: charactersError } = await supabase
        .from('session_characters')
        .select('id, name')
        .eq('session_id', sessionId)

      if (charactersError) throw charactersError
      
      // Get encounter monsters
      const { data: encounterMonsters, error: monstersError } = await supabase
        .from('combat_encounter_monsters')
        .select(`
          *,
          monster_template:monster_templates(*)
        `)
        .eq('encounter_id', encounterId)

      if (monstersError) throw monstersError
      
      // Create participants
      const participantsToCreate: any[] = []
      let turnOrder = 1
      
      // Add player participants
      characters.forEach((character: any) => {
        participantsToCreate.push({
          active_combat_id: combat.id,
          name: character.name,
          character_id: character.id,
          turn_order: turnOrder++
        })
      })
      
      // Add monster participants
      encounterMonsters.forEach((encounterMonster: any) => {
        const template = encounterMonster.monster_template
        if (!template) return
        
        for (let i = 1; i <= encounterMonster.quantity; i++) {
          const instanceName = encounterMonster.quantity > 1 ? `${template.name} ${i}` : template.name
          participantsToCreate.push({
            active_combat_id: combat.id,
            name: instanceName,
            monster_template_id: template.id,
            current_hit_points: template.hit_points,
            max_hit_points: template.hit_points,
            monster_instance_name: instanceName,
            turn_order: turnOrder++
          })
        }
      })
      
      const { data: newParticipants, error: participantsError } = await supabase
        .from('combat_participants')
        .insert(participantsToCreate)
        .select(`
          *,
          monster_template:monster_templates(*)
        `)

      if (participantsError) throw participantsError
      
      participants.value = (newParticipants || []).map((p: any) => enhanceParticipant(p))
      
      // Set the first participant as the current turn (sorted by initiative/turn_order)
      if (participants.value.length > 0) {
        const sortedParticipants = [...participants.value].sort((a, b) => {
          // Sort by initiative (descending), then by turn_order
          if (a.initiative !== null && b.initiative !== null) {
            if (a.initiative !== b.initiative) {
              return b.initiative - a.initiative
            }
          }
          return (a.turn_order || 0) - (b.turn_order || 0)
        })
        
        const firstParticipant = sortedParticipants[0]
        if (firstParticipant) {
          // Update the combat with the first participant's turn
          const { error: turnError } = await supabase
            .from('active_combats')
            .update({ current_turn_id: firstParticipant.id })
            .eq('id', combat.id)

          if (turnError) {
            console.error('Failed to set initial turn:', turnError)
          } else {
            if (activeCombat.value) {
              activeCombat.value.current_turn_id = firstParticipant.id
            }
          }
        }
      }
      
      return combat
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start combat'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const endCombat = async () => {
    if (!activeCombat.value) return
    
    try {
      const { error: endError } = await supabase
        .from('active_combats')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', activeCombat.value.id)

      if (endError) throw endError
      
      activeCombat.value = null
      participants.value = []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to end combat'
      throw err
    }
  }

  const updateParticipantInitiative = async (participantId: string, initiative: number) => {
    try {
      const { error: updateError } = await supabase
        .from('combat_participants')
        .update({ initiative })
        .eq('id', participantId)

      if (updateError) throw updateError
      
      const participant = participants.value.find((p: any) => p.id === participantId)
      if (participant) {
        participant.initiative = initiative
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update initiative'
      throw err
    }
  }

  const updateParticipantHealth = async (participantId: string, currentHitPoints: number) => {
    try {
      const { error: updateError } = await supabase
        .from('combat_participants')
        .update({ current_hit_points: currentHitPoints })
        .eq('id', participantId)

      if (updateError) throw updateError
      
      const participant = participants.value.find((p: any) => p.id === participantId)
      if (participant && participant.max_hit_points) {
        participant.current_hit_points = currentHitPoints
        participant.health_percentage = Math.round((currentHitPoints / participant.max_hit_points) * 100)
        participant.health_status = getHealthStatus(currentHitPoints, participant.max_hit_points) as any
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update health'
      throw err
    }
  }

  const nextTurn = async () => {
    if (!activeCombat.value || sortedParticipants.value.length === 0) return
    
    const currentIndex = sortedParticipants.value.findIndex((p: any) => p.id === activeCombat.value?.current_turn_id)
    const nextIndex = currentIndex + 1 >= sortedParticipants.value.length ? 0 : currentIndex + 1
    const nextParticipant = sortedParticipants.value[nextIndex]
    
    if (!nextParticipant) return
    
    // If we're going back to the first participant, increment round
    const roundIncrement = nextIndex === 0 ? 1 : 0
    
    try {
      const { error: updateError } = await supabase
        .from('active_combats')
        .update({ 
          current_turn_id: nextParticipant.id,
          round_number: activeCombat.value.round_number + roundIncrement
        })
        .eq('id', activeCombat.value.id)

      if (updateError) throw updateError
      
      activeCombat.value.current_turn_id = nextParticipant.id
      if (roundIncrement) {
        activeCombat.value.round_number += 1
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to advance turn'
      throw err
    }
  }

  const fetchActiveCombat = async (sessionId: string) => {
    try {
      const { data: combat, error: combatError } = await supabase
        .from('active_combats')
        .select(`
          *,
          encounter:combat_encounters(*)
        `)
        .eq('session_id', sessionId)
        .is('ended_at', null)
        .maybeSingle()

      if (combatError && combatError.code !== 'PGRST116') throw combatError
      
      activeCombat.value = combat || null
      
      if (combat) {
        const { data: combatParticipants, error: participantsError } = await supabase
          .from('combat_participants')
          .select(`
            *,
            monster_template:monster_templates(*)
          `)
          .eq('active_combat_id', combat.id)

        if (participantsError) throw participantsError
        
        participants.value = (combatParticipants || []).map((p: any) => enhanceParticipant(p))
      }
      
      // Subscribe to real-time updates
      subscribeToCombatUpdates(sessionId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch active combat'
    }
  }

  // Helper function to set up participant subscription
  const setupParticipantSubscription = (combatId: string) => {
    // Clean up existing participant subscription
    if (participantsSubscription) {
      supabase.removeChannel(participantsSubscription)
      participantsSubscription = null
    }

    participantsSubscription = supabase
      .channel('participants_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'combat_participants',
        filter: `active_combat_id=eq.${combatId}`
      }, (payload) => {
        console.log('Participant update received:', payload)
        
        if (payload.eventType === 'UPDATE' && payload.new) {
          // Update existing participant
          const index = participants.value.findIndex((p: any) => p.id === payload.new.id)
          if (index >= 0) {
            participants.value[index] = enhanceParticipant(payload.new as any)
          }
        } else if (payload.eventType === 'INSERT' && payload.new) {
          // Add new participant
          participants.value.push(enhanceParticipant(payload.new as any))
        } else if (payload.eventType === 'DELETE' && payload.old) {
          // Remove participant
          participants.value = participants.value.filter((p: any) => p.id !== payload.old.id)
        }
      })
      .subscribe()
  }

  // Helper function to fetch participants for a combat
  const fetchParticipantsForCombat = async (combatId: string) => {
    try {
      const { data: combatParticipants, error: participantsError } = await supabase
        .from('combat_participants')
        .select(`
          *,
          monster_template:monster_templates(*)
        `)
        .eq('active_combat_id', combatId)

      if (participantsError) throw participantsError
      
      participants.value = (combatParticipants || []).map((p: any) => enhanceParticipant(p))
    } catch (err) {
      console.error('Failed to fetch participants for combat:', err)
    }
  }

  // Real-time subscription management
  let combatSubscription: any = null
  let participantsSubscription: any = null

  const subscribeToCombatUpdates = (sessionId: string) => {
    // Clean up existing subscriptions
    unsubscribeFromCombatUpdates()

    // Subscribe to active combat changes
    combatSubscription = supabase
      .channel('combat_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'active_combats',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        console.log('Combat update received:', payload)
        
        if (payload.eventType === 'INSERT' && payload.new) {
          // New combat started for this session
          console.log('New combat started:', payload.new)
          activeCombat.value = payload.new as any
          // Fetch participants for the new combat
          fetchParticipantsForCombat(payload.new.id)
          // Set up participant subscription for the new combat
          setupParticipantSubscription(payload.new.id)
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          if (activeCombat.value && payload.new.id === activeCombat.value.id) {
            // Check if combat was ended (ended_at was set)
            if (payload.new.ended_at) {
              console.log('Combat ended via UPDATE with ended_at:', payload.new.ended_at)
              activeCombat.value = null
              participants.value = []
            } else {
              // Update current combat
              activeCombat.value = { ...activeCombat.value, ...payload.new }
            }
          }
        } else if (payload.eventType === 'DELETE') {
          // Combat was ended
          if (activeCombat.value && payload.old?.id === activeCombat.value.id) {
            activeCombat.value = null
            participants.value = []
          }
        }
      })
      .subscribe()

    // Subscribe to participant changes if combat is already active
    if (activeCombat.value) {
      setupParticipantSubscription(activeCombat.value.id)
    }
  }

  const unsubscribeFromCombatUpdates = () => {
    if (combatSubscription) {
      supabase.removeChannel(combatSubscription)
      combatSubscription = null
    }
    if (participantsSubscription) {
      supabase.removeChannel(participantsSubscription)
      participantsSubscription = null
    }
  }

  // Diagnostic function to check for combat state inconsistencies
  const diagnoseCombatState = async (sessionId: string) => {
    try {
      // Check for any active combats (including ended ones)
      const { data: allCombats, error: allCombatsError } = await supabase
        .from('active_combats')
        .select('*')
        .eq('session_id', sessionId)
        .order('started_at', { ascending: false })

      if (allCombatsError) throw allCombatsError

      // Check for active (non-ended) combats
      const activeCombats = allCombats?.filter(c => !c.ended_at) || []
      
      // Check for participants in each active combat
      const diagnostics = []
      for (const combat of activeCombats) {
        const { data: combatParticipants } = await supabase
          .from('combat_participants')
          .select('*')
          .eq('active_combat_id', combat.id)

        diagnostics.push({
          combat,
          participantCount: combatParticipants?.length || 0,
          hasParticipants: (combatParticipants?.length || 0) > 0
        })
      }

      return {
        totalCombats: allCombats?.length || 0,
        activeCombats: activeCombats.length,
        diagnostics,
        hasInconsistentState: activeCombats.length > 0 && diagnostics.some(d => !d.hasParticipants)
      }
    } catch (err) {
      console.error('Failed to diagnose combat state:', err)
      throw err
    }
  }

  // Force cleanup of invalid combat states
  const cleanupInvalidCombatState = async (sessionId: string) => {
    try {
      console.log(`Starting cleanup for session: ${sessionId}`)
      
      const diagnosis = await diagnoseCombatState(sessionId)
      console.log('Diagnosis result:', diagnosis)
      
      if (diagnosis.hasInconsistentState) {
        console.log('Cleaning up invalid combat state...')
        
        // End all active combats that have no participants
        let cleanupCount = 0
        for (const diagnostic of diagnosis.diagnostics) {
          if (!diagnostic.hasParticipants) {
            console.log(`Cleaning up combat ${diagnostic.combat.id} with ${diagnostic.participantCount} participants`)
            
            const { error: updateError } = await supabase
              .from('active_combats')
              .update({ ended_at: new Date().toISOString() })
              .eq('id', diagnostic.combat.id)
            
            if (updateError) {
              console.error(`Failed to end combat ${diagnostic.combat.id}:`, updateError)
            } else {
              console.log(`Successfully ended orphaned combat: ${diagnostic.combat.id}`)
              cleanupCount++
            }
          }
        }
        
        console.log(`Cleaned up ${cleanupCount} invalid combats`)
        
        // Refresh the combat state
        await fetchActiveCombat(sessionId)
        
        // Verify cleanup worked
        const postCleanupDiagnosis = await diagnoseCombatState(sessionId)
        console.log('Post-cleanup diagnosis:', postCleanupDiagnosis)
        
        return cleanupCount > 0 || !postCleanupDiagnosis.hasInconsistentState
      }
      
      console.log('No inconsistent state found')
      return false
    } catch (err) {
      console.error('Full error in cleanupInvalidCombatState:', err)
      error.value = err instanceof Error ? err.message : 'Failed to cleanup invalid combat state'
      throw err
    }
  }

  // Force end all active combats for a session (nuclear option)
  const forceEndAllCombats = async (sessionId: string) => {
    try {
      console.log(`Starting force end all combats for session: ${sessionId}`)
      
      // First, let's see what we're dealing with
      const { data: beforeCleanup, error: beforeError } = await supabase
        .from('active_combats')
        .select('*')
        .eq('session_id', sessionId)

      if (beforeError) {
        console.error('Error checking combats before cleanup:', beforeError)
        throw beforeError
      }
      
      console.log('Combats before cleanup:', beforeCleanup)
      
      // Try multiple approaches to end combats
      
      // Approach 1: Update ended_at for null values
      const { data: updateResult, error: updateError } = await supabase
        .from('active_combats')
        .update({ ended_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .is('ended_at', null)
        .select()

      console.log('Update result:', updateResult)
      if (updateError) {
        console.error('Update error:', updateError)
      }
      
      // Approach 2: If update didn't work, try direct delete
      if (updateError || !updateResult || updateResult.length === 0) {
        console.log('Update failed, trying delete...')
        const { error: deleteError } = await supabase
          .from('active_combats')
          .delete()
          .eq('session_id', sessionId)
          .is('ended_at', null)

        if (deleteError) {
          console.error('Delete error:', deleteError)
          throw deleteError
        }
        
        console.log('Successfully deleted active combats')
      }
      
      // Verify cleanup worked
      const { data: afterCleanup, error: afterError } = await supabase
        .from('active_combats')
        .select('*')
        .eq('session_id', sessionId)
        .is('ended_at', null)

      if (afterError) {
        console.error('Error checking after cleanup:', afterError)
      }
      
      console.log('Remaining active combats after cleanup:', afterCleanup)
      
      // Clear local state regardless
      activeCombat.value = null
      participants.value = []
      
      console.log(`Force ended all combats for session: ${sessionId}`)
      
      return {
        beforeCount: beforeCleanup?.length || 0,
        afterCount: afterCleanup?.length || 0,
        success: (afterCleanup?.length || 0) === 0
      }
      
    } catch (err) {
      console.error('Full error in forceEndAllCombats:', err)
      error.value = err instanceof Error ? err.message : 'Failed to force end combats'
      throw err
    }
  }

  // Remove participant from combat
  const removeParticipant = async (participantId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('combat_participants')
        .delete()
        .eq('id', participantId)

      if (deleteError) throw deleteError
      // Remove from local state
      participants.value = participants.value.filter((p: any) => p.id !== participantId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove participant'
      throw err
    }
  }

  return {
    // State
    monsters,
    encounters,
    activeCombat,
    participants,
    isLoading,
    error,
    
    // Getters
    sortedParticipants,
    currentParticipant,
    
    // Actions
    fetchMonsters,
    createMonster,
    updateMonster,
    deleteMonster,
    fetchEncounters,
    createEncounter,
    updateEncounter,
    deleteEncounter,
    addMonsterToEncounter,
    removeMonsterFromEncounter,
    startCombat,
    endCombat,
    updateParticipantInitiative,
    updateParticipantHealth,
    nextTurn,
    fetchActiveCombat,
    
    // Diagnostics and cleanup
    diagnoseCombatState,
    cleanupInvalidCombatState,
    forceEndAllCombats,
    
    // Real-time subscriptions
    subscribeToCombatUpdates,
    unsubscribeFromCombatUpdates,
    removeParticipant
  }
})