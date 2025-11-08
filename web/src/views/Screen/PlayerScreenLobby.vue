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

// Computed
const joinUrl = computed(() => {
  const baseUrl = window.location.origin
  return `${baseUrl}/join/${route.params.session_id}`
})

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
        session.value = payload.new as GameSession
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
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  color: white;
}

/* Header */
.session-header {
  text-align: center;
  margin-bottom: 3rem;
}

.session-name {
  font-size: 3rem;
  font-weight: bold;
  margin: 0 0 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.teaser-text {
  font-size: 1.2rem;
  margin: 0;
  max-width: 800px;
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
  gap: 4rem;
  align-items: start;
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
  padding: 1rem;
  border-radius: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.qr-code {
  width: 200px;
  height: 200px;
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

@media (max-width: 768px) {
  .content-overlay {
    padding: 1rem;
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