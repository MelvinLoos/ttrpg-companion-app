<template>
  <div class="gm-session-control">
    <!-- Main Status and Actions Row -->
    <div class="status-actions-row">
      <!-- Left side: Status Information -->
      <div class="status-section">
        <!-- Session Status -->
        <div class="session-status">
          <h3>Session Status</h3>
          <div class="status-indicator" :class="statusClass">
            <span class="status-dot"></span>
            <span class="status-text">{{ statusText }}</span>
          </div>
        </div>

        <!-- Active Combat Status (when active) -->
        <div v-if="activeCombat" class="combat-status-inline">
          <h3>Active Combat</h3>
          <div class="combat-info-inline">
            <div class="combat-detail">
              <span class="combat-label">Encounter:</span>
              <span class="combat-value">{{ activeCombat.encounter?.name || 'Unknown Encounter' }}</span>
            </div>
            <div class="combat-detail">
              <span class="combat-label">Round:</span>
              <span class="combat-value">{{ activeCombat.round_number || 1 }}</span>
            </div>
            <div class="combat-detail">
              <span class="combat-label">Participants:</span>
              <span class="combat-value">{{ combatStore.participants.length }}</span>
            </div>
            <div class="combat-detail" v-if="combatStore.currentParticipant">
              <span class="combat-label">Current Turn:</span>
              <span class="combat-value">{{ combatStore.currentParticipant.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: Action Buttons -->
      <div class="actions-section">
        <!-- Combat Actions (when in combat) -->
        <div v-if="activeCombat" class="combat-actions-inline">
          <button 
            @click="nextTurn"
            :disabled="loading || combatStore.participants.length === 0"
            class="next-turn-btn"
          >
            {{ loading ? 'Processing...' : 'Next Turn' }}
          </button>
          <button 
            @click="endCurrentCombat"
            :disabled="loading"
            class="end-combat-btn"
          >
            {{ loading ? 'Ending...' : 'End Combat' }}
          </button>
        </div>

        <!-- Session Actions -->
        <div class="session-actions">
          <button 
            v-if="currentSession?.state === 'LOBBY'"
            @click="startSession"
            :disabled="!canStartSession || loading"
            class="start-btn"
          >
            {{ loading ? 'Starting...' : 'Start Session' }}
          </button>
          
          <template v-else-if="currentSession?.state === 'IN_PLAY'">
            <button 
              v-if="!activeCombat"
              @click="showStartCombatModal = true"
              :disabled="loading"
              class="start-combat-btn"
            >
              Start Combat
            </button>
            <button 
              @click="pauseSession"
              :disabled="loading"
              class="pause-btn"
            >
              {{ loading ? 'Pausing...' : 'Pause Session' }}
            </button>
            <button 
              @click="endSession"
              :disabled="loading"
              class="end-btn"
            >
              {{ loading ? 'Ending...' : 'End Session' }}
            </button>
          </template>
          
          <button 
            v-else-if="currentSession?.state === 'PAUSED'"
            @click="resumeSession"
            :disabled="loading"
            class="resume-btn"
          >
            {{ loading ? 'Resuming...' : 'Resume Session' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Combat Diagnostics (shown when there are issues) -->
    <div v-if="showDiagnostics && combatDiagnostics" class="combat-diagnostics">
      <h3>Combat State Issues Detected</h3>
      <div class="diagnostic-info">
        <p class="diagnostic-message">
          Found {{ combatDiagnostics.activeCombats }} active combat(s) in the database, 
          but the UI shows inconsistent state.
        </p>
        <div v-if="combatDiagnostics.hasInconsistentState" class="diagnostic-details">
          <p class="text-sm text-yellow-300">
            Some active combats have no participants, which indicates corrupted data.
          </p>
        </div>
      </div>
      <div class="diagnostic-actions">
        <button 
          @click="debugCombatState"
          :disabled="loading"
          class="cleanup-btn"
        >
          {{ loading ? 'Checking...' : 'Debug Combat State' }}
        </button>
        <button 
          @click="cleanupInvalidState"
          :disabled="loading"
          class="cleanup-btn"
        >
          {{ loading ? 'Cleaning...' : 'Auto-Fix Invalid State' }}
        </button>
        <button 
          @click="forceEndAllCombats"
          :disabled="loading"
          class="force-end-btn"
        >
          {{ loading ? 'Ending...' : 'Force End All Combats' }}
        </button>
        <button 
          @click="hideDiagnostics"
          class="hide-diagnostics-btn"
        >
          Hide
        </button>
      </div>
    </div>

    <!-- Asset Gallery for pushing images to player screen -->
    <GmAssetGallery 
      v-if="currentSession"
      :session-id="currentSession.id"
      :current-image-asset-id="currentSession.current_image_asset_id"
      @image-pushed="handleImagePushed"
    />
  </div>

  <!-- Start Combat Modal - Full screen overlay -->
  <div v-if="showStartCombatModal" 
       class="modal-overlay"
       @click.self="closeStartCombatModal">
    <div class="modal-content">
      <div class="modal-inner">
        <!-- Modal Header -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">Start Combat</h2>
          <button
            @click="closeStartCombatModal"
            class="modal-close-btn"
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
                'encounter-card',
                selectedEncounterId === encounter.id ? 'encounter-selected' : 'encounter-unselected'
              ]"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center mb-1">
                    <h4 class="font-semibold text-white mr-2">{{ encounter.name }}</h4>
                    <svg v-if="selectedEncounterId === encounter.id" class="checkmark-icon" fill="currentColor" viewBox="0 0 20 20">
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
          <div class="modal-actions">
            <button
              @click="closeStartCombatModal"
              class="modal-btn modal-btn-cancel"
            >
              Cancel
            </button>
            <button
              v-if="selectedEncounterId"
              @click="startCombat"
              :disabled="startingCombat"
              class="modal-btn modal-btn-start"
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
.gm-session-control {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin: 0.5rem 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 60vh;
  overflow: hidden;
}

/* Status and Actions Row Layout */
.status-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.status-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.actions-section {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

/* Session Status Styles */
.session-status {
  margin-bottom: 0;
}

.combat-status-inline {
  margin-bottom: 0;
}

.combat-info-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
}

.combat-detail {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.combat-actions-inline {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.session-status h3,
.combat-status-inline h3 {
  margin: 0 0 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.status-text {
  font-weight: 500;
  font-size: 0.9rem;
}

/* Status-specific styling */
.status-lobby .status-dot {
  background-color: #fbbf24; /* yellow */
}

.status-lobby .status-text {
  color: #fbbf24;
}

.status-active .status-dot {
  background-color: #10b981; /* green */
}

.status-active .status-text {
  color: #10b981;
}

.status-paused .status-dot {
  background-color: #f59e0b; /* orange */
}

.status-paused .status-text {
  color: #f59e0b;
}

.status-unknown .status-dot {
  background-color: #6b7280; /* gray */
}

.status-unknown .status-text {
  color: #6b7280;
}

.session-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.session-actions button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
}

.start-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.start-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.pause-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.pause-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #d97706, #b45309);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.end-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.end-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-1px);
}

.resume-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.resume-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
}

.start-combat-btn {
  background: linear-gradient(135deg, #dc2626, #991b1b);
  color: white;
}

.start-combat-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #991b1b, #7f1d1d);
  transform: translateY(-1px);
}

.session-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.session-actions button:disabled:hover {
  background: revert;
  transform: none;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 9999;
}

.modal-content {
  background-color: #374151; /* gray-700 */
  border-radius: 0.5rem;
  width: 100%;
  max-width: 32rem; /* max-w-lg */
  border: 1px solid #4b5563; /* gray-600 */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-inner {
  padding: 1.5rem;
}

/* Modal close button */
.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  color: #9ca3af; /* gray-400 */
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  color: #ffffff;
  background-color: #374151; /* gray-700 */
}

/* Encounter selection cards */
.encounter-card {
  background-color: #374151; /* gray-700 */
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  position: relative;
}

.encounter-card:hover {
  background-color: #4b5563; /* gray-600 */
  border-color: #6b7280; /* gray-500 */
}

.encounter-unselected {
  border-color: transparent;
}

.encounter-selected {
  border-color: #3b82f6; /* blue-500 */
  background-color: #1e40af; /* blue-700 */
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.encounter-selected:hover {
  background-color: #1d4ed8; /* blue-800 */
}

/* Checkmark icon - ensure proper sizing */
.checkmark-icon {
  width: 1rem; /* 16px */
  height: 1rem; /* 16px */
  color: #60a5fa; /* blue-400 */
  flex-shrink: 0;
}

/* Modal actions - custom CSS since Tailwind utilities need proper import */
.modal-actions {
  display: flex;
  gap: 1rem; /* 16px gap between buttons */
  margin-top: 3rem; /* 48px top margin */
  padding-top: 1.5rem; /* 24px padding above border */
  border-top: 1px solid #374151; /* gray-700 border */
}

.modal-btn {
  padding: 0.75rem 1rem; /* py-3 px-4 */
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.modal-btn-cancel {
  flex: 1;
  background-color: #4b5563; /* gray-600 */
  color: white;
}

.modal-btn-cancel:hover {
  background-color: #374151; /* gray-700 */
}

.modal-btn-start {
  flex: 2;
  background-color: #dc2626; /* red-600 */
  color: white;
  padding: 0.75rem 1.5rem; /* py-3 px-6 */
}

.modal-btn-start:hover:not(:disabled) {
  background-color: #b91c1c; /* red-700 */
}

.modal-btn-start:disabled {
  background-color: #4b5563; /* gray-600 */
  cursor: not-allowed;
}

/* Combat Status Styles */
.combat-status {
  background: rgba(239, 68, 68, 0.1); /* red background with low opacity */
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.combat-status h3 {
  color: #ef4444; /* red-500 */
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.combat-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.combat-info > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.combat-label {
  color: #d1d5db; /* gray-300 */
  font-size: 0.875rem;
  font-weight: 500;
}

.combat-value {
  color: #f3f4f6; /* gray-100 */
  font-size: 0.875rem;
  font-weight: 600;
}

.combat-actions {
  display: flex;
  justify-content: center;
}

.end-combat-btn {
  background-color: #dc2626; /* red-600 */
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.end-combat-btn:hover:not(:disabled) {
  background-color: #b91c1c; /* red-700 */
}

.end-combat-btn:disabled {
  background-color: #6b7280; /* gray-500 */
  cursor: not-allowed;
}

.next-turn-btn {
  background-color: #3b82f6; /* blue-600 */
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.next-turn-btn:hover:not(:disabled) {
  background-color: #2563eb; /* blue-700 */
}

.next-turn-btn:disabled {
  background-color: #6b7280; /* gray-500 */
  cursor: not-allowed;
}

/* Combat Diagnostics Styles */
.combat-diagnostics {
  background: rgba(245, 158, 11, 0.1); /* amber background with low opacity */
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.combat-diagnostics h3 {
  color: #f59e0b; /* amber-500 */
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.diagnostic-info {
  margin-bottom: 1rem;
}

.diagnostic-message {
  color: #f3f4f6; /* gray-100 */
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.diagnostic-details {
  background: rgba(245, 158, 11, 0.05);
  border-radius: 0.375rem;
  padding: 0.75rem;
}

.diagnostic-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.cleanup-btn, .force-end-btn, .hide-diagnostics-btn {
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cleanup-btn {
  background-color: #10b981; /* green-600 */
  color: white;
}

.cleanup-btn:hover:not(:disabled) {
  background-color: #047857; /* green-700 */
}

.force-end-btn {
  background-color: #dc2626; /* red-600 */
  color: white;
}

.force-end-btn:hover:not(:disabled) {
  background-color: #b91c1c; /* red-700 */
}

.hide-diagnostics-btn {
  background-color: #6b7280; /* gray-500 */
  color: white;
}

.hide-diagnostics-btn:hover {
  background-color: #4b5563; /* gray-600 */
}

.cleanup-btn:disabled, .force-end-btn:disabled {
  background-color: #6b7280; /* gray-500 */
  cursor: not-allowed;
}
</style>