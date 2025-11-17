<template>
  <div class="h-screen bg-stone-900 text-stone-100 flex flex-col">
    <header class="bg-stone-900 text-stone-100 border-b p-6 flex flex-col gap-4">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white">Game Lobby</h1>
          <p class="text-stone-400 mt-1">Manage your game sessions and players</p>
        </div>

        <div class="flex flex-wrap gap-4 items-center justify-between">
          <div v-if="sessionStore.state.sessions.length > 0" class="flex items-center gap-2">
            <label for="active-session" class="text-sm text-stone-300">Active Session:</label>
            <select id="active-session" v-model="selectedSessionId" @change="handleSessionChange"
              class="p-2 rounded bg-stone-700 border border-stone-600 text-stone-100 min-w-[180px]">
              <option value="none">No Session</option>
              <option v-for="session in sessionStore.activeSessions" :key="session.id" :value="session.id">
                {{ session.name }}
              </option>
            </select>
          </div>
          <button v-if="currentSession" @click="openPlayerScreen"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium flex items-center gap-2 shadow-lg"
            title="Open Player Screen in new window">
            <span class="align-middle">📺</span>
            Open Player Screen
          </button>
        </div>
        <p v-if="sessionStore.state.sessions.length === 0" class="no-sessions">
          <router-link to="/gm/sessions">Create a session</router-link> first to get started.
        </p>
      </div>
    </header>

    <!-- Notifications -->
    <div v-if="notifications.length > 0" class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <div v-for="notification in notifications" :key="notification.id" :class="[
        'flex items-center justify-between px-4 py-3 rounded-lg shadow-lg border-l-4',
        notification.type === 'success' ? 'border-green-500 bg-green-50 text-green-900' : '',
        notification.type === 'info' ? 'border-blue-500 bg-blue-50 text-blue-900' : '',
        notification.type === 'warning' ? 'border-yellow-500 bg-yellow-50 text-yellow-900' : ''
      ]">
        <span class="font-medium flex-1">{{ notification.message }}</span>
        <button @click="dismissNotification(notification.id)"
          class="ml-4 text-xl opacity-60 hover:opacity-100">✕</button>
      </div>
    </div>

    <!-- Make content area scrollable while keeping header fixed -->
    <div class="flex-1 overflow-y-auto pb-20">

      <div v-if="selectedSessionId === 'none'"
        class="flex flex-col items-center justify-center text-center text-stone-400 py-16">
        <h3 class="text-xl font-bold mb-2">Player Join Disabled</h3>
        <p>No active session - players cannot join at this time.</p>
      </div>

      <div v-else-if="currentSession" class="flex flex-col px-6">
        <div class="relative rounded-lg overflow-hidden bg-stone-800 w-full h-56 mb-4">
          <img v-if="currentSession.active_image_url" :src="currentSession.active_image_url" :alt="currentSession.name"
            class="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div class="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/80 to-transparent text-white z-10">
            <h1 class="text-2xl font-bold mb-1">{{ currentSession.name }}</h1>
            <p v-if="currentSession.teaser_text" class="text-stone-300">{{ currentSession.teaser_text }}</p>
          </div>
        </div>
        <GmSessionControl :current-session="currentSession" :player-count="currentPlayers.length" />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-stone-900 border border-stone-700 rounded-lg p-6">
            <h3 class="text-lg font-bold mb-4">Players in Session</h3>
            <div v-if="currentPlayers.length > 0" class="flex flex-col gap-2">
              <div v-for="player in currentPlayers" :key="player.id"
                class="flex items-center gap-3 bg-stone-800 rounded p-2 border border-stone-700">
                <img v-if="player.portrait_url" :src="player.portrait_url" :alt="player.name"
                  class="w-8 h-8 rounded-full object-cover" @error="handleImageError" @load="handleImageLoad" />
                <div v-else
                  class="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-stone-400 font-bold">{{
                    player.name[0] }}</div>
                <span class="flex-1">{{ player.name }}</span>
                <button @click="kickPlayer(player.id)"
                  class="w-6 h-6 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
                  :disabled="sessionStore.state.loading" title="Remove player from session">✕</button>
              </div>
            </div>
            <p v-else class="text-stone-400 italic text-center mt-2">No players have joined yet</p>
          </div>
          <div class="bg-stone-900 border border-stone-700 rounded-lg p-6">
            <h3 class="text-lg font-bold mb-4">Player Join</h3>
            <div class="flex flex-col gap-2">
              <p class="text-stone-300">Players can join at:</p>
              <div class="flex items-center gap-2">
                <code class="flex-1 p-2 bg-stone-800 rounded border border-stone-700 text-xs">{{ joinUrl }}</code>
                <button @click="copyJoinUrl"
                  class="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition">Copy</button>
              </div>
              <div class="flex justify-center mt-2">
                <div id="lobby-qr-code" class="rounded bg-white p-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center text-center text-stone-400 py-16">
        <h3 class="text-xl font-bold mb-2">Select a session above to start</h3>
        <p>Choose one of your created sessions to open the lobby for players.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useSessionStore } from '../../stores/session'
import { supabase } from '../../plugins/supabase'
import type { SessionCharacter } from '../../types/session'
import QRCode from 'qrcode'
import GmSessionControl from '../../components/GmSessionControl.vue'

const sessionStore = useSessionStore()
const selectedSessionId = ref<string>('')

const characterSubscription = ref<(() => void) | null>(null)
const localCharacters = ref<SessionCharacter[]>([])

// Notification state
const notifications = ref<{ id: number, message: string, type: 'success' | 'info' | 'warning' }[]>([])
let notificationIdCounter = 1

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
          // Show notification for new player join
          addNotification(`${newCharacter.name} joined the session!`, 'success')
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const updated = payload.new as SessionCharacter
        localCharacters.value = localCharacters.value.map(c =>
          c.id === updated.id ? updated : c
        )
      } else if (payload.eventType === 'DELETE') {
        const deletedRecord = (payload.old || payload.new) as SessionCharacter | null
        if (deletedRecord?.id) {
          const playerName = deletedRecord.name || 'A player'
          localCharacters.value = localCharacters.value.filter(c => c.id !== deletedRecord.id)
          // Show notification for player leaving
          addNotification(`${playerName} left the session`, 'warning')
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
  const confirmKick = confirm(`Are you sure you want to remove "${player.name}" from the session?`)
  if (!confirmKick) return
  try {
    // Set current_turn_id to NULL for all combats referencing this player
    await supabase
      .from('active_combats')
      .update({ current_turn_id: null })
      .eq('session_id', currentSession.value.id)
      .eq('current_turn_id', playerId)
    // Delete combat_participants for this player in all combats
    await supabase
      .from('combat_participants')
      .delete()
      .eq('character_id', playerId)
      .in('active_combat_id',
        (await supabase
          .from('active_combats')
          .select('id')
          .eq('session_id', currentSession.value.id)
        ).data?.map(c => c.id) || []
      )
    // Now delete the player
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
  await sessionStore.fetchSessions()

  // Restore selected session from localStorage if available
  const savedSessionId = localStorage.getItem('activeSessionId')
  if (savedSessionId && sessionStore.state.sessions.length > 0 && savedSessionId !== '') {
    selectedSessionId.value = savedSessionId
    await handleSessionChange()
    if (currentSession.value) {
      await loadCharacters()
      subscribeToCharacterChanges()
    }
  } else if (sessionStore.state.currentSession?.id) {
    selectedSessionId.value = sessionStore.state.currentSession.id
    await handleSessionChange()
    if (currentSession.value) {
      await loadCharacters()
      subscribeToCharacterChanges()
    }
  } else {
    // If no active session, default to 'No Session'
    selectedSessionId.value = 'none'
    await handleSessionChange()
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

// Persist selection to localStorage
watch(selectedSessionId, (newId) => {
  localStorage.setItem('activeSessionId', newId || '')
})
</script>

<style scoped></style>