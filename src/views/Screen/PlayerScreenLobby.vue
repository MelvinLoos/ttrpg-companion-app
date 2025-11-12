<template>
  <div class="player-screen-lobby">
    <!-- Background image display -->
    <div 
      v-if="session?.active_image_url" 
      class="background-image"
      :style="{ backgroundImage: `url(${session.active_image_url})` }"
    ></div>
    <div v-else class="default-background"></div>

    <!-- Session content overlay -->
    <div class="content-overlay">
      <!-- Session header -->
      <header class="session-header">
        <h1 v-if="session?.name" class="session-name">{{ session.name }}</h1>
        <h1 v-else>Loading Session...</h1>
        <p v-if="session?.teaser_text" class="teaser-text">{{ session.teaser_text }}</p>
      </header>

      <!-- Main content area -->
      <main class="lobby-main">
        <!-- QR Code for joining -->
        <div class="qr-section">
          <div class="qr-container">
            <div id="qr-code" class="qr-code"></div>
          </div>
          <div class="join-info">
            <h3>Join the Adventure</h3>
            <p>Scan the QR code or visit:</p>
            <code class="join-url">{{ joinUrl }}</code>
          </div>
        </div>

        <!-- Party members display -->
        <div class="party-section">
          <PartyBar :session-id="route.params.session_id as string" />
        </div>
      </main>
    </div>

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

    <!-- Loading state -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading session...</p>
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-overlay">
      <div class="error-message">
        <h3>Session Not Found</h3>
        <p>{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'
import type { GameSession } from '../../types/session'
import { supabase } from '../../plugins/supabase'
import PartyBar from '../../components/PartyBar.vue'

const route = useRoute()

// Component state
const session = ref<GameSession | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Notification state
const notifications = ref<{id: number, message: string, type: 'success' | 'info' | 'warning'}[]>([])
let notificationIdCounter = 1

// Computed
const joinUrl = computed(() => {
  const baseUrl = window.location.origin
  return `${baseUrl}/join/${route.params.session_id}`
})

// Notification methods
function addNotification(message: string, type: 'success' | 'info' | 'warning' = 'info') {
  console.log('PlayerScreenLobby: Adding notification', { message, type })
  const notification = {
    id: notificationIdCounter++,
    message,
    type
  }
  notifications.value.push(notification)
  console.log('PlayerScreenLobby: Current notifications', notifications.value)
  
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
  const sessionId = route.params.session_id as string
  
  try {
    // Fetch session data
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      throw new Error('Session not found')
    }

    session.value = sessionData

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load session'
  } finally {
    loading.value = false
  }
}

async function generateQRCode() {
  const qrElement = document.getElementById('qr-code')
  if (qrElement && joinUrl.value) {
    try {
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, joinUrl.value, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      qrElement.innerHTML = ''
      qrElement.appendChild(canvas)
    } catch (err) {
      console.error('Failed to generate QR code:', err)
      // Fallback to placeholder
      qrElement.innerHTML = `
        <div class="qr-placeholder">
          <div>QR Code</div>
          <div style="font-size: 0.8rem; margin-top: 0.5rem;">${joinUrl.value}</div>
        </div>
      `
    }
  }
}

function subscribeToSessionChanges() {
  const sessionId = route.params.session_id as string
  
  // Subscribe to session changes
  const sessionSubscription = supabase
    .channel(`session-${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'sessions',
      filter: `id=eq.${sessionId}`
    }, (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        const newSession = payload.new as GameSession
        const oldState = session.value?.state
        const newState = newSession.state
        
        console.log('PlayerScreenLobby: Session state change detected', { oldState, newState })
        
        // Check if session started (transitioned to IN_PLAY)
        if (oldState === 'LOBBY' && newState === 'IN_PLAY') {
          console.log('PlayerScreenLobby: Adding session start notification')
          addNotification(`🎮 Session has started! The adventure begins now!`, 'success')
        } else if (oldState === 'IN_PLAY' && newState === 'LOBBY') {
          console.log('PlayerScreenLobby: Adding session end notification')
          addNotification('📋 Session ended. Thanks for playing!', 'info')
        } else if (oldState === 'IN_PLAY' && newState === 'PAUSED') {
          console.log('PlayerScreenLobby: Adding session pause notification')
          addNotification('⏸️ Session paused. Stand by...', 'warning')
        } else if (oldState === 'PAUSED' && newState === 'IN_PLAY') {
          console.log('PlayerScreenLobby: Adding session resume notification')
          addNotification('▶️ Session resumed! Back to the adventure!', 'success')
        }
        
        session.value = newSession
      }
    })
    .subscribe()

  return () => {
    sessionSubscription.unsubscribe()
  }
}

// Lifecycle
onMounted(async () => {
  await loadSessionData()
  const unsubscribe = subscribeToSessionChanges()
  
  // Generate QR code after DOM is ready
  if (!error.value) {
    setTimeout(generateQRCode, 100)
  }

  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<style scoped>
.player-screen-lobby {
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Background */
.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: brightness(0.4);
  z-index: 1;
}

.default-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  z-index: 1;
}

/* Content overlay */
.content-overlay {
  position: relative;
  z-index: 2;
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: white;
  overflow: hidden;
}

/* Header */
.session-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  flex-shrink: 0;
}

.session-name {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0 0 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.teaser-text {
  font-size: 1.1rem;
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  opacity: 0.9;
}

/* Main content */
.lobby-main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
  padding: 0 1rem 1rem;
  overflow: hidden;
}

/* QR Section */
.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.qr-container {
  background: white;
  padding: 0.75rem;
  border-radius: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.qr-code {
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-placeholder {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  border: 2px dashed #ccc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.9rem;
  text-align: center;
}

.join-info h3 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.join-info p {
  margin: 0 0 0.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.join-url {
  background: rgba(0, 0, 0, 0.6);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 1rem;
  word-break: break-all;
}

/* Party section */
.party-section {
  width: 100%;
}

/* Loading and Error overlays */
.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  max-width: 400px;
}

.error-message h3 {
  margin: 0 0 1rem;
  color: #ff6b6b;
}

.error-message p {
  margin: 0;
  opacity: 0.8;
}

/* Responsive design */
@media (max-width: 1024px) {
  .lobby-main {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  
  .session-name {
    font-size: 2.5rem;
  }
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

@media (max-width: 768px) {
  .lobby-main {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0 0.5rem 0.5rem;
  }
  
  .session-name {
    font-size: 2rem;
  }
  
  .teaser-text {
    font-size: 1rem;
  }
  
  .qr-code {
    width: 150px;
    height: 150px;
  }
}
</style>