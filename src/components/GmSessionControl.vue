<template>
  <div class="gm-session-control">
    <div class="session-status">
      <h3>Session Status</h3>
      <div class="status-indicator" :class="statusClass">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>

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

    <!-- Asset Gallery for pushing images to player screen -->
    <GmAssetGallery 
      v-if="currentSession"
      :session-id="currentSession.id"
      :current-image-asset-id="currentSession.current_image_asset_id"
      @image-pushed="handleImagePushed"
    />

    <!-- Start Combat Modal -->
    <div v-if="showStartCombatModal" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 rounded-lg w-full max-w-md">
        <div class="p-6">
          <h2 class="text-xl font-bold text-white mb-4">Start Combat</h2>
          
          <div v-if="combatStore.encounters.length === 0" class="text-gray-400 text-center py-8">
            <p>No encounters available.</p>
            <p class="mt-2">Create some encounters first in the Encounters tab.</p>
          </div>
          
          <div v-else class="space-y-3">
            <p class="text-sm text-gray-300 mb-4">Select an encounter to start combat:</p>
            <div
              v-for="encounter in combatStore.encounters"
              :key="encounter.id"
              @click="selectedEncounterId = encounter.id"
              :class="[
                'bg-gray-700 rounded p-3 cursor-pointer border-2 transition-colors',
                selectedEncounterId === encounter.id ? 'border-blue-500' : 'border-transparent hover:border-gray-500'
              ]"
            >
              <h4 class="font-semibold text-white">{{ encounter.name }}</h4>
              <p v-if="encounter.description" class="text-sm text-gray-300 mt-1">{{ encounter.description }}</p>
              <div v-if="encounter.monsters && encounter.monsters.length > 0" class="text-xs text-gray-400 mt-2">
                {{ encounter.monsters.length }} monster type{{ encounter.monsters.length !== 1 ? 's' : '' }}
              </div>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              v-if="selectedEncounterId && combatStore.encounters.length > 0"
              @click="startCombat"
              :disabled="startingCombat"
              class="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {{ startingCombat ? 'Starting...' : 'Start Combat' }}
            </button>
            <button
              @click="closeStartCombatModal"
              class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
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

const startCombat = async () => {
  if (!props.currentSession?.id || !selectedEncounterId.value) return
  
  try {
    startingCombat.value = true
    await combatStore.startCombat(props.currentSession.id, selectedEncounterId.value)
    closeStartCombatModal()
    // Optionally redirect to combat view or show combat tracker
  } catch (error) {
    console.error('Failed to start combat:', error)
    alert('Failed to start combat. Please try again.')
  } finally {
    startingCombat.value = false
  }
}

// Load encounters when component mounts or session changes
watch(() => props.currentSession?.id, async (sessionId) => {
  if (sessionId) {
    await Promise.all([
      combatStore.fetchEncounters(),
      combatStore.fetchActiveCombat(sessionId)
    ])
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

.session-status {
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.session-status h3 {
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
</style>