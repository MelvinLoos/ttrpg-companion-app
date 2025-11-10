<template>
  <div class="lobby-view">
    <header class="lobby-header">
      <h2>Game Lobby</h2>
      <div class="header-controls">
        <div class="session-selector" v-if="sessionStore.state.sessions.length > 0">
          <label for="active-session">Active Session:</label>
          <select 
            id="active-session" 
            v-model="selectedSessionId" 
            @change="handleSessionChange"
          >
            <option value="">Select a session...</option>
            <option value="none">No Session</option>
            <option 
              v-for="session in sessionStore.activeSessions" 
              :key="session.id" 
              :value="session.id"
            >
              {{ session.name }}
            </option>
          </select>
        </div>
        <button 
          v-if="currentSession" 
          @click="openPlayerScreen" 
          class="player-screen-btn"
          title="Open Player Screen in new window"
        >
          📺 Open Player Screen
        </button>
      </div>
      <p v-if="sessionStore.state.sessions.length === 0" class="no-sessions">
        <router-link to="/gm/sessions">Create a session</router-link> first to get started.
      </p>
    </header>

    <div v-if="selectedSessionId === 'none'" class="no-session-selected">
      <h3>Player Join Disabled</h3>
      <p>No active session - players cannot join at this time.</p>
    </div>

    <div v-else-if="currentSession" class="lobby-content">
      <div class="session-display">
        <div class="session-background" v-if="currentSession.active_image_url">
          <img :src="currentSession.active_image_url" :alt="currentSession.name" />
        </div>
        <div class="session-overlay">
          <h1 class="session-title">{{ currentSession.name }}</h1>
          <p v-if="currentSession.teaser_text" class="session-teaser">
            {{ currentSession.teaser_text }}
          </p>
        </div>
      </div>

      <div class="lobby-controls">
        <div class="player-section">
          <h3>Players in Session</h3>
          <div v-if="currentPlayers.length > 0" class="player-list">
            <div v-for="player in currentPlayers" :key="player.id" class="player-card">
              <img 
                v-if="player.portrait_url" 
                :src="player.portrait_url" 
                :alt="player.name" 
                @error="handleImageError"
                @load="handleImageLoad"
              />
              <div v-else class="no-portrait">{{ player.name[0] }}</div>
              <span class="player-name">{{ player.name }}</span>
              <button 
                @click="kickPlayer(player.id)" 
                class="kick-btn"
                title="Remove player from session"
                :disabled="sessionStore.state.loading"
              >
                ✕
              </button>
            </div>
          </div>
          <p v-else class="no-players">No players have joined yet</p>
        </div>

        <div class="join-section">
          <h3>Player Join</h3>
          <div class="join-info">
            <p>Players can join at:</p>
            <div class="join-url">
              <code>{{ joinUrl }}</code>
              <button @click="copyJoinUrl" class="copy-btn">Copy</button>
            </div>
            <div class="qr-container">
              <div id="lobby-qr-code" class="qr-code"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-session-selected">
      <h3>Select a session above to start</h3>
      <p>Choose one of your created sessions to open the lobby for players.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useSessionStore } from '../stores/session'
import { supabase } from '../plugins/supabase'
import type { SessionCharacter } from '../types/session'
import QRCode from 'qrcode'

const sessionStore = useSessionStore()
const selectedSessionId = ref<string>('')
const characterSubscription = ref<(() => void) | null>(null)
const localCharacters = ref<SessionCharacter[]>([])

// Computed properties
const currentSession = computed(() => 
  sessionStore.state.currentSession
)

const currentPlayers = computed(() => 
  localCharacters.value
)

const joinUrl = computed(() => {
  if (!currentSession.value) return ''
  return `${window.location.origin}/join/${currentSession.value.id}`
})

// Watch joinUrl to regenerate QR code
watch(joinUrl, async (newUrl) => {
  if (newUrl) {
    await nextTick()
    generateQRCode()
  }
}, { immediate: false })

// Real-time subscription for character changes
function subscribeToCharacterChanges() {
  // Unsubscribe from any existing subscription
  if (characterSubscription.value) {
    characterSubscription.value()
    characterSubscription.value = null
  }
  
  if (!currentSession.value?.id) {
    return
  }
  
  const subscription = supabase
    .channel(`lobby-characters-${currentSession.value.id}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public', 
      table: 'session_characters',
      filter: `session_id=eq.${currentSession.value.id}`
    }, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newCharacter = payload.new as SessionCharacter
        // Check if character already exists to avoid duplicates
        if (!localCharacters.value.find(c => c.id === newCharacter.id)) {
          localCharacters.value = [...localCharacters.value, newCharacter]
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const updated = payload.new as SessionCharacter
        localCharacters.value = localCharacters.value.map(c => 
          c.id === updated.id ? updated : c
        )
      } else if (payload.eventType === 'DELETE') {
        const deletedRecord = (payload.old || payload.new) as SessionCharacter | null
        if (deletedRecord?.id) {
          localCharacters.value = localCharacters.value.filter(c => c.id !== deletedRecord.id)
        }
      }
    })
    .subscribe()

  characterSubscription.value = () => subscription.unsubscribe()
}

// Load characters for the current session
async function loadCharacters() {
  if (!currentSession.value?.id) {
    localCharacters.value = []
    return
  }

  try {
    const { data, error } = await supabase
      .from('session_characters')
      .select('*')
      .eq('session_id', currentSession.value.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    localCharacters.value = data || []
  } catch (error) {
    console.error('Failed to load characters:', error)
    localCharacters.value = []
  }
}

// Watch for session changes to re-subscribe to character updates
watch(currentSession, async (newSession, oldSession) => {
  if (newSession?.id !== oldSession?.id) {
    await loadCharacters()
    subscribeToCharacterChanges()
  }
}, { immediate: true })

// Image handling
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  console.warn('Failed to load portrait image:', img.src)
  // You could set a fallback image here if needed
}

function handleImageLoad() {
  // Portrait loaded successfully
}

// Methods
async function handleSessionChange() {
  if (selectedSessionId.value && selectedSessionId.value !== 'none') {
    await sessionStore.setCurrentSession(selectedSessionId.value)
  } else {
    await sessionStore.setCurrentSession(null)
  }
}

async function copyJoinUrl() {
  if (joinUrl.value) {
    try {
      await navigator.clipboard.writeText(joinUrl.value)
      // URL copied to clipboard successfully
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }
}

function openPlayerScreen() {
  if (currentSession.value) {
    const playerScreenUrl = `${window.location.origin}/screen/${currentSession.value.id}`
    window.open(playerScreenUrl, '_blank', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1200,height=800')
  }
}

async function kickPlayer(playerId: string) {
  if (!currentSession.value) return
  
  const player = currentPlayers.value.find(p => p.id === playerId)
  if (!player) return

  // Show confirmation dialog
  const confirmKick = confirm(`Are you sure you want to remove "${player.name}" from the session?`)
  if (!confirmKick) return
  
  try {
    const { error } = await supabase
      .from('session_characters')
      .delete()
      .eq('id', playerId)
      .eq('session_id', currentSession.value.id)

    if (error) throw error
    
    // Player removed successfully
  } catch (error) {
    console.error('Failed to kick player:', error)
    alert(`Failed to remove player "${player.name}". Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function generateQRCode() {
  const qrElement = document.getElementById('lobby-qr-code')
  if (qrElement && joinUrl.value) {
    try {
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, joinUrl.value, {
        width: 120,
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
          <div style="font-size: 0.7rem; margin-top: 0.5rem; opacity: 0.7;">Unable to generate</div>
        </div>
      `
    }
  }
}

// Lifecycle
let unsubscribeSession: (() => void) | null = null

onMounted(async () => {
  sessionStore.fetchSessions()
  
  // Set the first session as selected if none is current
  if (sessionStore.activeSessions.length > 0 && !sessionStore.state.currentSession) {
    const firstSession = sessionStore.activeSessions[0]
    if (firstSession) {
      selectedSessionId.value = firstSession.id
      handleSessionChange()
    }
  } else if (sessionStore.state.currentSession) {
    selectedSessionId.value = sessionStore.state.currentSession.id
  }
  
  // Generate initial QR code if we have a session
  await nextTick()
  if (joinUrl.value) {
    generateQRCode()
  }

  // Subscribe to real-time changes
  unsubscribeSession = sessionStore.subscribeToChanges()
})

onUnmounted(() => {
  if (unsubscribeSession) {
    unsubscribeSession()
  }
  // Cleanup character subscription
  if (characterSubscription.value) {
    characterSubscription.value()
  }
})
</script>

<style scoped>
.lobby-view {
  padding: 0.25rem;
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.lobby-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.lobby-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
  flex-wrap: wrap;
}

.session-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.session-selector label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
}

.session-selector select {
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.9rem;
  min-width: 200px;
}

.session-selector select option {
  background: rgba(0, 0, 0, 0.9);
  color: white;
}

.player-screen-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  background: rgba(59, 130, 246, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.8);
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.player-screen-btn:hover {
  background: rgba(59, 130, 246, 0.8);
}

.no-sessions {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  text-align: center;
}

.no-sessions a {
  color: rgba(59, 130, 246, 0.8);
  text-decoration: none;
}

.no-sessions a:hover {
  color: rgba(59, 130, 246, 1);
}

.lobby-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.session-display {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  width: 100%;
  height: 400px;
  flex-shrink: 0;
}

.session-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.session-background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.6);
}

.session-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2rem;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  z-index: 2;
}

.session-title {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.session-teaser {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.lobby-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  height: auto;
}

.player-section,
.join-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.player-section h3,
.join-section h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 180px;
  overflow-y: auto;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.player-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.player-card img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.player-name {
  flex: 1;
}

.kick-btn {
  background: rgba(220, 38, 38, 0.2);
  border: 1px solid rgba(220, 38, 38, 0.4);
  color: rgba(220, 38, 38, 0.9);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.kick-btn:hover {
  background: rgba(220, 38, 38, 0.3);
  border-color: rgba(220, 38, 38, 0.6);
  opacity: 1;
  transform: scale(1.05);
}

.kick-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

.no-portrait {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.no-players {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  text-align: center;
  margin: 1rem 0;
}

.join-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.join-info p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.join-url {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.join-url code {
  flex: 1;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  word-break: break-all;
}

.copy-btn {
  padding: 0.5rem 0.75rem;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 0.25rem;
  color: inherit;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: background-color 0.2s;
}

.copy-btn:hover {
  background: rgba(59, 130, 246, 0.3);
}

.qr-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0.5rem;
}

.qr-code {
  border-radius: 0.25rem;
  overflow: hidden;
  background: white;
  padding: 0.25rem;
}

.qr-code canvas {
  display: block;
  border-radius: 0.125rem;
}

.qr-placeholder {
  aspect-ratio: 1;
  width: 120px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  padding: 0.5rem;
  text-align: center;
}

.qr-placeholder p {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.no-session-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  height: 100%;
}

.no-session-selected h3 {
  margin: 0 0 1rem;
  font-size: 1.2rem;
}

.no-session-selected p {
  margin: 0;
  max-width: 400px;
}

/* Responsive design */
@media (max-width: 768px) {
  .lobby-controls {
    grid-template-columns: 1fr;
  }
  
  .session-display {
    height: 250px;
  }
  
  .session-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .lobby-view {
    padding: 0.25rem;
  }
  
  .header-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .session-selector {
    justify-content: space-between;
  }
  
  .session-selector select {
    min-width: auto;
    flex: 1;
  }
  
  .lobby-content {
    gap: 0.5rem;
  }
  
  .lobby-controls {
    flex-direction: column;
  }
  
  .session-overlay {
    padding: 1rem;
  }
  
  .session-title {
    font-size: 1.2rem;
  }
  
  .session-teaser {
    font-size: 0.9rem;
  }
  
  .player-screen-btn {
    justify-content: center;
  }
}
</style>