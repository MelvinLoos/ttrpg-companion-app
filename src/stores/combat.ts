import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  MonsterTemplate, 
  CombatEncounter, 
  CombatEncounterWithMonsters,
  ActiveCombat,
  CombatParticipant,
  CombatParticipantWithType,
  CreateCombatParticipantData,
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
      const { data, error: fetchError } = await (supabase as any)
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
      const { data, error: createError } = await (supabase as any)
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
      const { data, error: updateError } = await (supabase as any)
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
      const { error: deleteError } = await (supabase as any)
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
      const { data, error: fetchError } = await (supabase as any)
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
      const { data, error: createError } = await (supabase as any)
        .from('combat_encounters')
        .insert([encounter])
        .select()
        .single()

      if (createError) throw createError
      
      const newEncounter: CombatEncounterWithMonsters = {
        ...data,
        monsters: []
      }
      encounters.value.push(newEncounter)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create encounter'
      throw err
    }
  }

  const addMonsterToEncounter = async (encounterId: string, monsterTemplateId: string, quantity: number = 1) => {
    try {
      const { data, error: addError } = await (supabase as any)
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

  const startCombat = async (sessionId: string, encounterId: string) => {
    try {
      isLoading.value = true
      
      // Create active combat
      const { data: combat, error: combatError } = await (supabase as any)
        .from('active_combats')
        .insert([{
          session_id: sessionId,
          encounter_id: encounterId
        }])
        .select()
        .single()

      if (combatError) throw combatError
      
      activeCombat.value = combat as any
      
      // Get session characters
      const { data: characters, error: charactersError } = await supabase
        .from('session_characters')
        .select('id, name')
        .eq('session_id', sessionId)

      if (charactersError) throw charactersError
      
      // Get encounter monsters
      const { data: encounterMonsters, error: monstersError } = await (supabase as any)
        .from('combat_encounter_monsters')
        .select(`
          *,
          monster_template:monster_templates(*)
        `)
        .eq('encounter_id', encounterId)

      if (monstersError) throw monstersError
      
      // Create participants
      const participantsToCreate: CreateCombatParticipantData[] = []
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
      
      const { data: newParticipants, error: participantsError } = await (supabase as any)
        .from('combat_participants')
        .insert(participantsToCreate)
        .select(`
          *,
          monster_template:monster_templates(*)
        `)

      if (participantsError) throw participantsError
      
      participants.value = (newParticipants || []).map((p: any) => enhanceParticipant(p))
      
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
      const { error: endError } = await (supabase as any)
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
      const { error: updateError } = await (supabase as any)
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
      const { error: updateError } = await (supabase as any)
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
    
    // If we're going back to the first participant, increment round
    const roundIncrement = nextIndex === 0 ? 1 : 0
    
    try {
      const { error: updateError } = await (supabase as any)
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
      const { data: combat, error: combatError } = await (supabase as any)
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
        const { data: combatParticipants, error: participantsError } = await (supabase as any)
          .from('combat_participants')
          .select(`
            *,
            monster_template:monster_templates(*)
          `)
          .eq('active_combat_id', combat.id)

        if (participantsError) throw participantsError
        
        participants.value = (combatParticipants || []).map((p: any) => enhanceParticipant(p))
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch active combat'
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
    addMonsterToEncounter,
    startCombat,
    endCombat,
    updateParticipantInitiative,
    updateParticipantHealth,
    nextTurn,
    fetchActiveCombat
  }
})