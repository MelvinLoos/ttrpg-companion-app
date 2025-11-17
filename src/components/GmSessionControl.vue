<template>
  <div class="flex flex-col w-full min-h-0 bg-white/5 border border-white/10 rounded-lg p-3 my-2 h-full">
    <!-- Status Blocks Row: Session Block + Combat Block side by side -->
    <div class="flex flex-row gap-4 w-full mb-4">
      <!-- Session Block -->
      <div class="flex-1 min-w-0 flex flex-col bg-white/5 border border-white/10 rounded-lg p-4">
        <h3 class="text-lg font-bold text-stone-100 mb-2">Session Status</h3>
        <div :class="['flex items-center gap-2 mb-4', statusClass]">
          <span class="w-3 h-3 rounded-full inline-block"
                :class="{
                  'bg-yellow-400': statusClass === 'status-lobby',
                  'bg-green-500': statusClass === 'status-active',
                  'bg-orange-400': statusClass === 'status-paused',
                  'bg-gray-500': statusClass === 'status-unknown'
                }"
          ></span>
          <span class="font-semibold text-stone-200"
                :class="{
                  'text-yellow-400': statusClass === 'status-lobby',
                  'text-green-500': statusClass === 'status-active',
                  'text-orange-400': statusClass === 'status-paused',
                  'text-gray-500': statusClass === 'status-unknown'
                }"
          >{{ statusText }}</span>
        </div>
        <!-- Session Actions below status, buttons inline -->
        <div class="flex flex-row flex-wrap items-center gap-2">
          <button 
            v-if="currentSession?.state === 'LOBBY'"
            @click="startSession"
            :disabled="!canStartSession || loading"
            class="start-btn bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Starting...' : 'Start Session' }}
          </button>
          <template v-else-if="currentSession?.state === 'IN_PLAY'">
            <button 
              v-if="!activeCombat"
              @click="showStartCombatModal = true"
              :disabled="loading"
              class="start-combat-btn bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Start Combat
            </button>
            <button 
              @click="pauseSession"
              :disabled="loading"
              class="pause-btn bg-yellow-500 hover:bg-yellow-600 text-white rounded px-4 py-2 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Pausing...' : 'Pause Session' }}
            </button>
            <button 
              @click="endSession"
              :disabled="loading"
              class="end-btn bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Ending...' : 'End Session' }}
            </button>
          </template>
          <button 
            v-else-if="currentSession?.state === 'PAUSED'"
            @click="resumeSession"
            :disabled="loading"
            class="resume-btn bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Resuming...' : 'Resume Session' }}
          </button>
        </div>
      </div>
      <!-- Combat Block -->
      <div class="flex-1 min-w-0 flex flex-row bg-red-500/10 border border-red-500/30 rounded-lg p-4 items-start gap-6" v-if="activeCombat">
        <!-- Combat Status -->
        <div class="flex-1 min-w-0 flex flex-col">
          <h3 class="text-lg font-bold text-red-500 mb-3">Active Combat</h3>
          <div class="grid grid-cols-2 gap-2 mt-2 mb-0">
            <div class="combat-detail flex flex-col">
              <span class="combat-label text-stone-400 text-xs">Encounter:</span>
              <span class="combat-value text-stone-100 text-sm font-semibold">{{ activeCombat.encounter?.name || 'Unknown Encounter' }}</span>
            </div>
            <div class="combat-detail flex flex-col">
              <span class="combat-label text-stone-400 text-xs">Round:</span>
              <span class="combat-value text-stone-100 text-sm font-semibold">{{ activeCombat.round_number || 1 }}</span>
            </div>
            <div class="combat-detail flex flex-col">
              <span class="combat-label text-stone-400 text-xs">Participants:</span>
              <span class="combat-value text-stone-100 text-sm font-semibold">{{ combatStore.participants.length }}</span>
            </div>
            <div class="combat-detail flex flex-col" v-if="combatStore.currentParticipant">
              <span class="combat-label text-stone-400 text-xs">Current Turn:</span>
              <span class="combat-value text-stone-100 text-sm font-semibold">{{ combatStore.currentParticipant.name }}</span>
            </div>
          </div>
        </div>
        <!-- Combat Actions on the side -->
        <div class="flex flex-col items-center gap-2 pt-6">
          <button 
            @click="nextTurn"
            :disabled="loading || combatStore.participants.length === 0"
            class="next-turn-btn bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Processing...' : 'Next Turn' }}
          </button>
          <button 
            @click="endCurrentCombat"
            :disabled="loading"
            class="end-combat-btn bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Ending...' : 'End Combat' }}
          </button>
        </div>
      </div>
    </div>


    <!-- Combat Diagnostics (shown when there are issues) -->
    <div v-if="showDiagnostics && combatDiagnostics" class="bg-amber-100/10 border border-amber-300/30 rounded-lg p-4 mb-4">
      <h3 class="text-lg font-bold text-amber-500 mb-2">Combat State Issues Detected</h3>
      <div class="mb-4">
        <p class="text-stone-100 text-sm mb-2">
          Found {{ combatDiagnostics.activeCombats }} active combat(s) in the database, 
          but the UI shows inconsistent state.
        </p>
        <div v-if="combatDiagnostics.hasInconsistentState" class="bg-amber-100/5 rounded px-3 py-2">
          <p class="text-xs text-yellow-300">
            Some active combats have no participants, which indicates corrupted data.
          </p>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap justify-center">
        <button 
          @click="debugCombatState"
          :disabled="loading"
          class="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Checking...' : 'Debug Combat State' }}
        </button>
        <button 
          @click="cleanupInvalidState"
          :disabled="loading"
          class="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Cleaning...' : 'Auto-Fix Invalid State' }}
        </button>
        <button 
          @click="forceEndAllCombats"
          :disabled="loading"
          class="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Ending...' : 'Force End All Combats' }}
        </button>
        <button 
          @click="hideDiagnostics"
          class="bg-stone-500 hover:bg-stone-600 text-white rounded px-4 py-2 font-semibold transition"
        >
          Hide
        </button>
      </div>
    </div>

    <!-- Asset Gallery for pushing images to player screen -->
  <div class="flex-1 min-h-0">
      <GmAssetGallery 
        v-if="currentSession"
        :session-id="currentSession.id"
        :current-image-asset-id="currentSession.current_image_asset_id"
        @image-pushed="handleImagePushed"
      />
    </div>
  </div>

  <!-- Start Combat Modal - Full screen overlay -->
  <div v-if="showStartCombatModal" 
  class="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-9999"
       @click.self="closeStartCombatModal">
    <div class="bg-gray-700 rounded-lg w-full max-w-lg border border-gray-600 shadow-2xl max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- Modal Header -->
  <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">Start Combat</h2>
          <button
            @click="closeStartCombatModal"
            class="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 bg-transparent border-none cursor-pointer transition hover:text-white hover:bg-gray-700"
            aria-label="Close modal"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Modal Content -->
        <div v-if="combatStore.encounters.length === 0" class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-lg font-medium">No encounters available</p>
            <p class="text-sm mt-2">Create some encounters first in the Encounters tab.</p>
          </div>
          <button
            @click="closeStartCombatModal"
            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
        
        <div v-else class="space-y-4">
          <p class="text-sm text-gray-300">Select an encounter to start combat:</p>
          <div class="max-h-96 overflow-y-auto space-y-3">
            <div
              v-for="encounter in combatStore.encounters"
              :key="encounter.id"
              @click="selectedEncounterId = encounter.id"
              :class="[
                'bg-gray-700 rounded-lg p-4 cursor-pointer border-2 transition relative',
                selectedEncounterId === encounter.id ? 'border-blue-500 bg-blue-700 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]' : 'border-transparent',
                selectedEncounterId === encounter.id ? 'hover:bg-blue-800' : 'hover:bg-gray-600'
              ]"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center mb-1">
                    <h4 class="font-semibold text-white mr-2">{{ encounter.name }}</h4>
                    <svg v-if="selectedEncounterId === encounter.id" class="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <p v-if="encounter.description" class="text-sm text-gray-300 mb-2">{{ encounter.description }}</p>
                  <div class="flex items-center gap-4 text-xs text-gray-400">
                    <span v-if="encounter.monsters && encounter.monsters.length > 0">
                      🎲 {{ encounter.monsters.length }} monster type{{ encounter.monsters.length !== 1 ? 's' : '' }}
                    </span>
                    <span>
                      📅 Created {{ formatDate(encounter.created_at) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Modal Actions -->
          <div class="flex gap-4 mt-12 pt-6 border-t border-gray-700">
            <button
              @click="closeStartCombatModal"
              class="flex-1 bg-gray-600 text-white rounded-lg py-3 px-4 font-semibold text-sm transition hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              v-if="selectedEncounterId"
              @click="startCombat"
              :disabled="startingCombat"
              class="flex-2 bg-red-600 text-white rounded-lg py-3 px-6 font-semibold text-sm transition hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <span v-if="startingCombat">
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Starting Combat...
              </span>
              <span v-else>
                ⚔️ Start Combat
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { supabase } from '../plugins/supabase'
import type { GameSession } from '../types/session'
import { useCombatStore } from '../stores/combat'
import GmAssetGallery from './GmAssetGallery.vue'

const loading = ref(false)

// Combat related state
const combatStore = useCombatStore()
const showStartCombatModal = ref(false)
const selectedEncounterId = ref<string>('')
const startingCombat = ref(false)

// Diagnostics related state
const showDiagnostics = ref(false)
const combatDiagnostics = ref<any>(null)

// Props
interface Props {
  currentSession: GameSession | null
  playerCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  playerCount: 0
})

// Get active combat for current session
const activeCombat = computed(() => combatStore.activeCombat)

// Computed properties
const statusText = computed(() => {
  switch (props.currentSession?.state) {
    case 'LOBBY':
      return 'Waiting to Start'
    case 'IN_PLAY':
      return 'Session in Progress'
    case 'PAUSED':
      return 'Session Paused'
    default:
      return 'Unknown'
  }
})

const statusClass = computed(() => {
  switch (props.currentSession?.state) {
    case 'LOBBY':
      return 'status-lobby'
    case 'IN_PLAY':
      return 'status-active'
    case 'PAUSED':
      return 'status-paused'
    default:
      return 'status-unknown'
  }
})

const canStartSession = computed(() => {
  // Can start if we have players and session is in lobby state
  return props.currentSession?.state === 'LOBBY'
})

// Methods
async function startSession() {
  if (!props.currentSession || loading.value) return
  
  try {
    loading.value = true
    
    const { error } = await supabase
      .from('sessions')
      .update({ 
        state: 'IN_PLAY',
        updated_at: new Date().toISOString()
      })
      .eq('id', props.currentSession.id)
    
    if (error) throw error
    
    console.log(`Session ${props.currentSession.name} started`)
  } catch (error) {
    console.error('Failed to start session:', error)
    alert('Failed to start session. Please try again.')
  } finally {
    loading.value = false
  }
}

async function endSession() {
  if (!props.currentSession || loading.value) return
  
  try {
    loading.value = true
    
    const { error } = await supabase
      .from('sessions')
      .update({ 
        state: 'LOBBY',
        updated_at: new Date().toISOString()
      })
      .eq('id', props.currentSession.id)
    
    if (error) throw error
    
    console.log(`Session ${props.currentSession.name} ended`)
  } catch (error) {
    console.error('Failed to end session:', error)
    alert('Failed to end session. Please try again.')
  } finally {
    loading.value = false
  }
}

async function pauseSession() {
  if (!props.currentSession || loading.value) return
  
  try {
    loading.value = true
    
    const { error } = await supabase
      .from('sessions')
      .update({ 
        state: 'PAUSED',
        updated_at: new Date().toISOString()
      })
      .eq('id', props.currentSession.id)
    
    if (error) throw error
    
    console.log(`Session ${props.currentSession.name} paused`)
  } catch (error) {
    console.error('Failed to pause session:', error)
    alert('Failed to pause session. Please try again.')
  } finally {
    loading.value = false
  }
}

async function resumeSession() {
  if (!props.currentSession || loading.value) return
  
  try {
    loading.value = true
    
    const { error } = await supabase
      .from('sessions')
      .update({ 
        state: 'IN_PLAY',
        updated_at: new Date().toISOString()
      })
      .eq('id', props.currentSession.id)
    
    if (error) throw error
    
    console.log(`Session ${props.currentSession.name} resumed`)
  } catch (error) {
    console.error('Failed to resume session:', error)
    alert('Failed to resume session. Please try again.')
  } finally {
    loading.value = false
  }
}

function handleImagePushed(assetId: string) {
  console.log(`Image asset ${assetId} pushed to player screen`)
  // The GmAssetGallery component handles the actual update to the database
  // This is just for logging/feedback in the GM interface
}

// Combat functions
const closeStartCombatModal = () => {
  showStartCombatModal.value = false
  selectedEncounterId.value = ''
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const startCombat = async () => {
  if (!props.currentSession?.id || !selectedEncounterId.value) return
  
  try {
    startingCombat.value = true
    
    // Check if there's already an active combat
    if (combatStore.activeCombat) {
      const confirmMessage = `There is already an active combat in progress. Do you want to end the current combat and start a new one?`
      if (!confirm(confirmMessage)) {
        return
      }
      
      // End the current combat first
      await combatStore.endCombat()
    }
    
    await combatStore.startCombat(props.currentSession.id, selectedEncounterId.value)
    closeStartCombatModal()
    // Optionally redirect to combat view or show combat tracker
  } catch (error) {
    console.error('Failed to start combat:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check if it's a database constraint error
    if (errorMessage.includes('Database constraint error')) {
      alert('Database constraint issue detected. The database migration to fix this has been applied. Please refresh the page and try again.')
    } else if (errorMessage.includes('active combat')) {
      // Show diagnostics for other active combat issues
      showDiagnostics.value = true
      
      try {
        const diagnosis = await combatStore.diagnoseCombatState(props.currentSession.id)
        combatDiagnostics.value = diagnosis
        alert(errorMessage + ' Please use the diagnostic tools below to resolve this.')
      } catch (diagError) {
        console.error('Failed to diagnose combat state:', diagError)
        alert(errorMessage)
      }
    } else {
      alert(`Failed to start combat: ${errorMessage}`)
    }
  } finally {
    startingCombat.value = false
  }
}

const endCurrentCombat = async () => {
  if (!activeCombat.value) return
  
  const confirmMessage = `Are you sure you want to end the current combat? This cannot be undone.`
  if (!confirm(confirmMessage)) return
  
  try {
    loading.value = true
    await combatStore.endCombat()
    console.log('Combat ended successfully')
  } catch (error) {
    console.error('Failed to end combat:', error)
    alert('Failed to end combat. Please try again.')
  } finally {
    loading.value = false
  }
}

const nextTurn = async () => {
  if (!activeCombat.value) return
  
  try {
    loading.value = true
    await combatStore.nextTurn()
    console.log('Advanced to next turn')
  } catch (error) {
    console.error('Failed to advance turn:', error)
    alert('Failed to advance to next turn. Please try again.')
  } finally {
    loading.value = false
  }
}

// Diagnostic and cleanup functions
const debugCombatState = async () => {
  if (!props.currentSession?.id) return
  
  try {
    loading.value = true
    console.log('=== DEBUGGING COMBAT STATE ===')
    
    // Get detailed state from store
    const diagnosis = await combatStore.diagnoseCombatState(props.currentSession.id)
    console.log('Store diagnosis:', diagnosis)
    
    // Also query database directly
    const { data: allCombats, error: allError } = await supabase
      .from('active_combats')
      .select('*')
      .eq('session_id', props.currentSession.id)
      .order('started_at', { ascending: false })

    console.log('All combats in database:', allCombats)
    console.log('Database query error (if any):', allError)
    
    // Check participants for each combat
    if (allCombats) {
      for (const combat of allCombats) {
        const { data: participants } = await supabase
          .from('combat_participants')
          .select('*')
          .eq('active_combat_id', combat.id)
        
        console.log(`Combat ${combat.id} (ended: ${combat.ended_at}) has ${participants?.length || 0} participants:`, participants)
      }
    }
    
    // Show current store state
    console.log('Current store activeCombat:', combatStore.activeCombat)
    console.log('Current store participants:', combatStore.participants)
    
    console.log('=== END DEBUG ===')
    
    // Update UI with fresh diagnosis
    combatDiagnostics.value = diagnosis
    showDiagnostics.value = true
    
    alert('Debug information has been logged to the browser console. Press F12 to view.')
  } catch (error) {
    console.error('Debug error:', error)
    alert('Debug failed. Check console for details.')
  } finally {
    loading.value = false
  }
}
const cleanupInvalidState = async () => {
  if (!props.currentSession?.id) return
  
  try {
    loading.value = true
    const cleaned = await combatStore.cleanupInvalidCombatState(props.currentSession.id)
    
    if (cleaned) {
      console.log('Successfully cleaned up invalid state')
      alert('Invalid combat state has been fixed. You can now start combat normally.')
      showDiagnostics.value = false
      combatDiagnostics.value = null
    } else {
      alert('No invalid state was found to clean up.')
    }
  } catch (error) {
    console.error('Failed to cleanup invalid state:', error)
    alert('Failed to cleanup invalid state. Please try the Force End All Combats option.')
  } finally {
    loading.value = false
  }
}

const forceEndAllCombats = async () => {
  if (!props.currentSession?.id) return
  
  const confirmMessage = `Are you sure you want to force end ALL combats for this session? This will permanently end any active combats and cannot be undone.`
  if (!confirm(confirmMessage)) return
  
  try {
    loading.value = true
    console.log('Starting force end all combats...')
    
    const result = await combatStore.forceEndAllCombats(props.currentSession.id)
    console.log('Force end result:', result)
    
    // Force refresh the combat state
    await combatStore.fetchActiveCombat(props.currentSession.id)
    
    // Check if we successfully cleared the state
    if (result && result.success) {
      alert(`Successfully cleared ${result.beforeCount} combat(s). You can now start combat normally.`)
    } else {
      alert(`Attempted to clear ${result?.beforeCount || 0} combat(s). ${result?.afterCount || 0} may still remain. Check the browser console for details.`)
    }
    
    showDiagnostics.value = false
    combatDiagnostics.value = null
  } catch (error) {
    console.error('Failed to force end combats:', error)
    alert(`Failed to force end combats: ${error instanceof Error ? error.message : 'Unknown error'}. Check the browser console for details.`)
  } finally {
    loading.value = false
  }
}

const hideDiagnostics = () => {
  showDiagnostics.value = false
  combatDiagnostics.value = null
}

// Load encounters when component mounts or session changes
watch(() => props.currentSession?.id, async (sessionId) => {
  if (sessionId) {
    await Promise.all([
      combatStore.fetchEncounters(),
      combatStore.fetchActiveCombat(sessionId)
    ])
    
    // Check for inconsistent states after loading
    try {
      const diagnosis = await combatStore.diagnoseCombatState(sessionId)
      if (diagnosis.hasInconsistentState) {
        console.log('Inconsistent combat state detected on load:', diagnosis)
        combatDiagnostics.value = diagnosis
        showDiagnostics.value = true
      }
    } catch (error) {
      console.error('Failed to check combat state on load:', error)
    }
  }
}, { immediate: true })
</script>

<style scoped>
</style>