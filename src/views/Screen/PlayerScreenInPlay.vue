<template>
  <div class="player-screen-in-play">
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
        <div v-if="session?.teaser_text" class="scene-subtitle">
          {{ session.teaser_text }}
        </div>
      </header>

      <!-- Main content area -->
      <main class="in-play-main">
        <!-- Overlay containers for party and session info -->
        <div class="overlay-containers">
          <!-- Session info - Top Right -->
          <div class="session-info">
            <h4>Session Details</h4>
            <div class="details-grid">
              <div class="detail-item status-item">
                <span class="status-badge status-active">{{ statusText }}</span>
              </div>
              <div class="detail-item" v-if="session?.created_at">
                <span class="label">Started:</span>
                <span class="value">{{ formatDate(session.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Bottom section with party -->
          <div class="bottom-section">
            <!-- Party members display -->
            <div class="party-section">
              <PartyBar :session-id="route.params.session_id as string" :compact="true" :square="true" />
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Fullscreen toggle button in corner -->
    <button 
      @click="toggleFullscreen" 
      class="fullscreen-btn"
      :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
    >
      <span v-if="isFullscreen">⤓</span>
      <span v-else>⤢</span>
    </button>

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
import type { GameSession } from '../../types/session'
import { supabase } from '../../plugins/supabase'
import PartyBar from '../../components/PartyBar.vue'

const route = useRoute()

// Component state
const session = ref<GameSession | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const playerCount = ref(0)

// Notification state
const notifications = ref<{id: number, message: string, type: 'success' | 'info' | 'warning'}[]>([])
let notificationIdCounter = 1

// Fullscreen state
const isFullscreen = ref(false)

// Computed
const statusText = computed(() => {
  switch (session.value?.state) {
    case 'IN_PLAY':
      return 'In Progress'
    case 'PAUSED':
      return 'Paused'
    case 'LOBBY':
      return 'In Lobby'
    default:
      return 'Unknown'
  }
})

// Notification methods
function addNotification(message: string, type: 'success' | 'info' | 'warning' = 'info') {
  const notification = {
    id: notificationIdCounter++,
    message,
    type
  }
  notifications.value.push(notification)
  
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

    // Load player count
    await loadPlayerCount(sessionId)

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load session'
  } finally {
    loading.value = false
  }
}

async function loadPlayerCount(sessionId: string) {
  try {
    const { count, error: countError } = await supabase
      .from('session_characters')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    if (countError) throw countError
    playerCount.value = count || 0
  } catch (err) {
    console.error('Failed to load player count:', err)
    playerCount.value = 0
  }
}

function subscribeToSessionChanges() {
  const sessionId = route.params.session_id as string
  
  // Subscribe to session changes
  const sessionSubscription = supabase
    .channel(`session-inplay-${sessionId}`)
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
        
        // Check for state transitions and show notifications
        if (oldState === 'LOBBY' && newState === 'IN_PLAY') {
          addNotification(`🎮 Session has started! The adventure begins now!`, 'success')
        } else if (oldState === 'IN_PLAY' && newState === 'LOBBY') {
          addNotification('📋 Session ended. Thanks for playing!', 'info')
        } else if (oldState === 'IN_PLAY' && newState === 'PAUSED') {
          addNotification('⏸️ Session paused. Stand by...', 'warning')
        } else if (oldState === 'PAUSED' && newState === 'IN_PLAY') {
          addNotification('▶️ Session resumed! Back to the adventure!', 'success')
        }
        
        session.value = newSession
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'session_characters',
      filter: `session_id=eq.${sessionId}`
    }, () => {
      // Reload player count when characters change
      loadPlayerCount(sessionId)
    })
    .subscribe()

  return () => {
    sessionSubscription.unsubscribe()
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Fullscreen functionality
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      isFullscreen.value = true
    } else {
      await document.exitFullscreen()
      isFullscreen.value = false
    }
  } catch (error) {
    console.error('Error toggling fullscreen:', error)
  }
}

// Listen for fullscreen changes from other sources (like F11)
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// Lifecycle
onMounted(async () => {
  await loadSessionData()
  const unsubscribe = subscribeToSessionChanges()

  // Add fullscreen event listener
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  onUnmounted(() => {
    unsubscribe()
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  })
})
</script>

<style scoped>
.player-screen-in-play {
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
  filter: brightness(0.7);
  z-index: 1;
}

.default-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f29 50%, #0f1419 100%);
  z-index: 1;
}

/* Content overlay */
.content-overlay {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
}

/* Session Header */
.session-header {
  text-align: center;
  padding: 0.6rem 1rem 0.3rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3));
  flex-shrink: 0;
}

.session-name {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin: 0 0 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.scene-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  font-style: italic;
  margin: 0 0 1rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  line-height: 1.4;
  padding: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.session-status {
  margin-top: 0.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-active {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
}

/* Main Content */
.in-play-main {
  flex: 1;
  position: relative;
  height: calc(100vh - 120px); /* Subtract header height */
  overflow: hidden;
  padding: 1rem;
}

.overlay-containers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem 1rem 0;
  pointer-events: none;
  gap: 1rem;
}

.overlay-containers > * {
  pointer-events: auto;
}

.session-info {
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 0.75rem;
  backdrop-filter: blur(10px);
  max-width: 200px;
  align-self: flex-end;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.bottom-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  align-self: flex-end;
}

.party-section {
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  padding: 0.4rem 0.6rem 0.2rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  width: 100%;
}

.scene-description {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1rem;
  backdrop-filter: blur(10px);
  width: 100%;
}

.scene-description p {
  color: white;
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.5;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  text-align: center;
}

/* Session Info - Now overlaid */

.scene-display {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scene-display img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-scene {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1f29 0%, #0f1419 100%);
}

.no-scene-placeholder span {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.no-scene-placeholder p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.5rem;
  margin: 0;
}

/* Fullscreen Button */
.fullscreen-btn {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.375rem;
  padding: 0.375rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-size: 1rem;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Session Info - Now overlaid */
.session-info {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  padding: 1rem;
  backdrop-filter: blur(8px);
  width: 100%;
}

.session-info h4 {
  color: white;
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  text-align: center;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.status-item {
  justify-content: center;
  margin-bottom: 0.25rem;
}

.status-item .status-badge {
  width: 100%;
  text-align: center;
  justify-self: center;
}

.label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.value {
  color: white;
  font-weight: 600;
}

/* Loading and Error States */
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
  color: white;
  z-index: 10;
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
  font-size: 1.5rem;
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

/* Responsive design */
@media (max-width: 768px) {
  .session-name {
    font-size: 2rem;
  }

  .scene-subtitle {
    font-size: 1rem;
    margin: 0 0 0.75rem;
    max-width: 400px;
  }

  .in-play-main {
    padding: 0.5rem;
  }

  .overlay-containers {
    padding: 0.5rem 0.5rem 0;
  }

  .session-info {
    max-width: none;
    align-self: stretch;
  }

  .fullscreen-btn {
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.9rem;
    width: 2.25rem;
    height: 2.25rem;
  }

  .details-grid {
    gap: 0.25rem;
  }
}

@media (max-width: 480px) {
  .session-name {
    font-size: 1.5rem;
  }

  .scene-subtitle {
    font-size: 0.9rem;
    margin: 0 0 0.5rem;
    max-width: 300px;
  }

  .overlay-containers {
    padding: 0.25rem 0.25rem 0;
  }

  .session-info {
    padding: 0.75rem;
  }
}
</style>