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
      
      <button 
        v-else-if="currentSession?.state === 'IN_PLAY'"
        @click="endSession"
        :disabled="loading"
        class="end-btn"
      >
        {{ loading ? 'Ending...' : 'End Session' }}
      </button>
      
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { supabase } from '../plugins/supabase'
import type { GameSession } from '../types/session'

const loading = ref(false)

// Props
interface Props {
  currentSession: GameSession | null
  playerCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  playerCount: 0
})

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
</script>

<style scoped>
.gm-session-control {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin: 0.5rem 0;
}

.session-status {
  margin-bottom: 0.75rem;
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
  gap: 0.75rem;
  justify-content: center;
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