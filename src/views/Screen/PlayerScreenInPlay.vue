<template>
  <div class="player-screen-in-play">
    <!-- Background image display with fade transition -->
    <div class="background-container">
      <transition name="scene-fade" mode="out-in">
        <div 
          v-if="currentImageAsset?.url || session?.active_image_url"
          :key="(currentImageAsset?.url || session?.active_image_url) || 'no-image'"
          class="background-image"
          :style="{ backgroundImage: `url(${currentImageAsset?.url || session?.active_image_url})` }"
        ></div>
        <div v-else key="default" class="default-background"></div>
      </transition>
    </div>

    <!-- Session content overlay -->
    <div class="content-overlay">
      <!-- Session header -->
      <header class="session-header">
        <div class="header-content">
          <h1 v-if="session?.name" class="session-name">{{ session.name }}</h1>
          <h1 v-else>Loading Session...</h1>
          <span class="status-badge header-status" :class="statusClass">{{ statusText }}</span>
        </div>
        <div v-if="session?.teaser_text" class="scene-subtitle">
          {{ session.teaser_text }}
        </div>
      </header>

      <!-- Main content area -->
      <main class="in-play-main">
        <!-- Simplified overlay containers -->
        <div class="overlay-containers">
          <!-- Combat tracker sidebar (when active) -->
          <div v-if="showCombatTracker" class="combat-sidebar">
            <PublicCombatTracker :session-id="route.params.session_id as string" />
          </div>
          
          <!-- Party members display at bottom -->
          <div class="party-section" :class="{ 'with-combat': showCombatTracker }">
            <PartyBar :session-id="route.params.session_id as string" :compact="true" :square="true" />
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
import { useCombatStore } from '../../stores/combat'
import PartyBar from '../../components/PartyBar.vue'
import PublicCombatTracker from '../../components/PublicCombatTracker.vue'

const route = useRoute()

// Component state
const session = ref<GameSession | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const playerCount = ref(0)

// Combat store
const combatStore = useCombatStore()

// Current image asset state
const currentImageAsset = ref<{id: string, url: string, name?: string} | null>(null)

// Notification state
const notifications = ref<{id: number, message: string, type: 'success' | 'info' | 'warning'}[]>([])
let notificationIdCounter = 1

// Fullscreen state
const isFullscreen = ref(false)

// Computed
const showCombatTracker = computed(() => {
  return !!combatStore.activeCombat && combatStore.participants.length > 0
})

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

const statusClass = computed(() => {
  switch (session.value?.state) {
    case 'IN_PLAY':
      return 'status-active'
    case 'PAUSED':
      return 'status-paused'
    case 'LOBBY':
      return 'status-lobby'
    default:
      return 'status-unknown'
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

    // Load current image asset if one is set
    const currentAssetId = (sessionData as any).current_image_asset_id
    if (currentAssetId) {
      await loadCurrentImageAsset(currentAssetId)
    }

    // Load combat data
    await combatStore.fetchActiveCombat(sessionId)

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

async function loadCurrentImageAsset(assetId: string | null) {
  if (!assetId) {
    currentImageAsset.value = null
    return
  }

  try {
    const { data: asset, error: assetError } = await supabase
      .from('session_assets')
      .select('id, public_url, friendly_name')
      .eq('id', assetId)
      .single()

    if (assetError) {
      console.error('Failed to load current image asset:', assetError)
      currentImageAsset.value = null
      return
    }

    if (asset && asset.public_url) {
      // Preload the image for smoother transition
      const img = new Image()
      img.onload = () => {
        currentImageAsset.value = {
          id: asset.id,
          url: asset.public_url!,
          name: asset.friendly_name || undefined
        }
        console.log(`Loaded and displayed scene: ${asset.friendly_name || asset.id}`)
      }
      img.onerror = () => {
        console.error('Failed to load image:', asset.public_url)
        currentImageAsset.value = null
      }
      img.src = asset.public_url
    } else {
      currentImageAsset.value = null
    }
  } catch (err) {
    console.error('Error loading current image asset:', err)
    currentImageAsset.value = null
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
        const oldImageAssetId = session.value?.current_image_asset_id
        const newImageAssetId = newSession.current_image_asset_id
        
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

        // Check for image asset changes
        if (oldImageAssetId !== newImageAssetId) {
          console.log('Current image asset changed:', { old: oldImageAssetId, new: newImageAssetId })
          loadCurrentImageAsset(newImageAssetId || null)
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
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Background */
.background-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.background-image::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: inherit;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(20px) brightness(0.3);
  z-index: 1;
}

.background-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: inherit;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 2;
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

/* Scene fade transition */
.scene-fade-enter-active,
.scene-fade-leave-active {
  transition: all 0.4s ease-in-out;
}

.scene-fade-enter-from {
  opacity: 0;
  transform: scale(1.05);
}

.scene-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.scene-fade-enter-to,
.scene-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Content overlay */
.content-overlay {
  position: relative;
  z-index: 2;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* Session Header */
.session-header {
  text-align: center;
  padding: 0.6rem 1rem 0.3rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3));
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.session-name {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.header-status {
  font-size: 0.8rem;
  padding: 0.375rem 0.75rem;
}

.scene-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  font-style: italic;
  margin: 0.5rem 0 1rem;
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

.status-paused {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
}

.status-lobby {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  color: white;
  box-shadow: 0 0 20px rgba(107, 114, 128, 0.4);
}

.status-unknown {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
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
  justify-content: flex-end;
  padding: 1rem;
  pointer-events: none;
}

.overlay-containers > * {
  pointer-events: auto;
}

.party-section {
  background: transparent;
  padding: 0.4rem 0.6rem 0.2rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  width: 100%;
}

.party-section.with-combat {
  width: 65%;
}

/* Combat sidebar */
.combat-sidebar {
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 320px;
  max-width: calc(100vw - 2rem);
  z-index: 10;
  animation: slideInRight 0.3s ease-out;
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

/* Mobile adjustments for combat sidebar */
@media (max-width: 768px) {
  .combat-sidebar {
    position: fixed;
    top: auto;
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    width: auto;
    max-height: 50vh;
  }
  
  .party-section.with-combat {
    width: 100%;
    margin-bottom: 1rem;
  }
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
  right: 4rem; /* Move notifications to the left of the fullscreen button */
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
    padding: 0.5rem;
  }

  .fullscreen-btn {
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.9rem;
    width: 2.25rem;
    height: 2.25rem;
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
    padding: 0.25rem;
  }
}
</style>