<template>
  <div class="screen-layout">
    <!-- Notifications -->
    <div v-if="notifications.length > 0" class="notifications-container">
      <div 
        v-for="notification in notifications" 
        :key="notification.id" 
        class="notification"
        :class="`notification-${notification.type}`"
      >
        <span class="notification-message">{{ notification.message }}</span>
        <button 
          @click="dismissNotification(notification.id)" 
          class="notification-dismiss"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Conditional rendering based on session state -->
    <PlayerScreenLobby 
      v-if="sessionState === 'LOBBY'" 
      :key="`lobby-${sessionId}`"
    />
    <PlayerScreenInPlay 
      v-else-if="sessionState === 'IN_PLAY' || sessionState === 'PAUSED'" 
      :key="`inplay-${sessionId}`"
    />
    <!-- Fallback to lobby view while loading or if state is unknown -->
    <PlayerScreenLobby 
      v-else
      :key="`fallback-${sessionId}`"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../../plugins/supabase'
import type { GameSession } from '../../types/session'
import PlayerScreenLobby from './PlayerScreenLobby.vue'
import PlayerScreenInPlay from './PlayerScreenInPlay.vue'

const route = useRoute()

// Component state
const session = ref<GameSession | null>(null)
const loading = ref(true)

// Notification state
const notifications = ref<{id: number, message: string, type: 'success' | 'info' | 'warning'}[]>([])
let notificationIdCounter = 1

// Computed properties
const sessionId = computed(() => route.params.session_id as string)
const sessionState = computed(() => session.value?.state || 'LOBBY')

// Notification methods
function addNotification(message: string, type: 'success' | 'info' | 'warning' = 'info') {
  console.log('ScreenLayout: Adding notification', { message, type })
  const notification = {
    id: notificationIdCounter++,
    message,
    type
  }
  notifications.value.push(notification)
  console.log('ScreenLayout: Current notifications', notifications.value)
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    dismissNotification(notification.id)
  }, 5000)
}

function dismissNotification(notificationId: number) {
  const index = notifications.value.findIndex(n => n.id === notificationId)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// Methods
async function loadSessionData() {
  if (!sessionId.value) return

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId.value)
      .single()

    if (error) {
      console.error('Failed to load session:', error)
      return
    }

    session.value = data
  } catch (err) {
    console.error('Error loading session:', err)
  } finally {
    loading.value = false
  }
}

function subscribeToSessionChanges() {
  const subscription = supabase
    .channel(`screen-session-${sessionId.value}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'sessions',
      filter: `id=eq.${sessionId.value}`
    }, (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        const newSession = payload.new as GameSession
        const oldState = session.value?.state
        const newState = newSession.state
        
        console.log('ScreenLayout: Session state change detected', { oldState, newState })
        
        // Check for state transitions and show notifications
        if (oldState === 'LOBBY' && newState === 'IN_PLAY') {
          console.log('ScreenLayout: Adding session start notification')
          addNotification(`🎮 Session has started! The adventure begins now!`, 'success')
        } else if (oldState === 'IN_PLAY' && newState === 'LOBBY') {
          console.log('ScreenLayout: Adding session end notification')
          addNotification('📋 Session ended. Thanks for playing!', 'info')
        } else if (oldState === 'IN_PLAY' && newState === 'PAUSED') {
          console.log('ScreenLayout: Adding session pause notification')
          addNotification('⏸️ Session paused. Stand by...', 'warning')
        } else if (oldState === 'PAUSED' && newState === 'IN_PLAY') {
          console.log('ScreenLayout: Adding session resume notification')
          addNotification('▶️ Session resumed! Back to the adventure!', 'success')
        }
        
        session.value = newSession
      }
    })
    .subscribe()

  return () => subscription.unsubscribe()
}

// Lifecycle
onMounted(async () => {
  await loadSessionData()
  const unsubscribe = subscribeToSessionChanges()

  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<style scoped>
.screen-layout {
  min-height: 100vh;
  position: relative;
}

/* Notifications */
.notifications-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  border-left: 4px solid;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  animation: slideInRight 0.3s ease-out;
}

.notification-success {
  border-left-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  color: #047857;
}

.notification-info {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
  color: #1e40af;
}

.notification-warning {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
  color: #92400e;
}

.notification-message {
  font-weight: 500;
  flex: 1;
}

.notification-dismiss {
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  opacity: 0.6;
  padding: 0;
  margin-left: 1rem;
  font-size: 1.2rem;
  line-height: 1;
  transition: opacity 0.2s;
}

.notification-dismiss:hover {
  opacity: 1;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>