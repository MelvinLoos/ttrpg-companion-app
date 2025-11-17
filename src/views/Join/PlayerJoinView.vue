<template>
  <div class="min-h-screen bg-stone-900 text-stone-100">
    <!-- Notifications -->
    <div v-if="notifications.length > 0" class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <div v-for="notification in notifications" :key="notification.id"
        :class="[
          'flex items-center justify-between px-6 py-4 rounded-lg border-l-4 shadow-lg backdrop-blur bg-white/90 animate-slideInRight',
          notification.type === 'success' ? 'border-green-500 bg-green-50 text-green-800' : '',
          notification.type === 'info' ? 'border-blue-500 bg-blue-50 text-blue-800' : '',
          notification.type === 'warning' ? 'border-yellow-500 bg-yellow-50 text-yellow-800' : ''
        ]">
        <span class="font-medium flex-1">{{ notification.message }}</span>
        <button @click="dismissNotification(notification.id)" class="ml-4 text-xl opacity-60 hover:opacity-100 transition">✕</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div class="w-12 h-12 border-4 border-white border-t-blue-500 rounded-full animate-spin"></div>
      <p class="text-lg">Loading session...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center bg-red-100 border border-red-300 rounded-lg p-8 max-w-md">
        <h2 class="mb-4 text-2xl font-bold text-red-400">Session Not Found</h2>
        <p class="mb-2 text-red-700">{{ error }}</p>
        <button @click="$router.push('/gm')" class="mt-4 px-4 py-2 bg-white/10 border border-white/20 text-red-700 rounded hover:bg-white/20">Go to GM Panel</button>
      </div>
    </div>

    <!-- Join Form -->
    <div v-else-if="session" class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 p-4">
      <!-- Session Header -->
      <header class="col-span-full text-center pb-4 border-b border-white/10">
        <h1 class="mb-2 text-3xl font-bold text-white">Join {{ session.name }}</h1>
        <p v-if="session.teaser_text" class="text-lg text-white/70">{{ session.teaser_text }}</p>
      </header>

      <!-- Character Creation Form -->
      <form @submit.prevent="handleJoin" class="bg-white/5 border border-white/10 rounded-lg p-6">
        <div>
          <h3 class="mb-6 text-xl text-white/90">Character Selection</h3>
          <!-- Character Type Selection -->
          <div class="flex gap-4 mb-8">
            <label class="flex items-center gap-2 cursor-pointer px-4 py-2 border border-white/20 rounded bg-white/5 hover:bg-white/10 transition">
              <input type="radio" v-model="characterType" value="new" name="characterType" />
              <span class="font-medium">Create New Character</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer px-4 py-2 border border-white/20 rounded bg-white/5 hover:bg-white/10 transition" v-if="characterStore.sortedCharacters.length > 0">
              <input type="radio" v-model="characterType" value="premade" name="characterType" />
              <span class="font-medium">Choose Premade Character</span>
            </label>
          </div>

          <!-- Premade Character Selection -->
          <div v-if="characterType === 'premade'" class="mb-8">
            <h4 class="mb-2 text-lg text-white/80">Select a Character</h4>
            <p class="mb-4 text-sm text-white/60 italic">Click to select, double-click to join immediately</p>
            <div v-if="premadeCharacters.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div v-for="character in premadeCharacters" :key="character.id"
                :class="['bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer text-center transition', selectedPremadeId === character.id ? 'border-blue-400 bg-blue-100/10' : 'hover:bg-white/10 hover:border-blue-400']"
                @click="selectedPremadeId = character.id" @dblclick="joinWithPremadeCharacter(character.id)">
                <div class="mx-auto mb-3 w-20 h-20 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-2xl font-bold">
                  <img v-if="character.portrait_url" :src="character.portrait_url" :alt="character.name" class="w-full h-full object-cover" />
                  <div v-else class="text-white/50">{{ character.name.charAt(0) }}</div>
                </div>
                <div>
                  <h5 class="mb-1 text-lg font-bold text-white">{{ character.name }}</h5>
                  <div v-if="character.stats_json" class="grid grid-cols-3 gap-1 text-xs text-white/70">
                    <span v-for="(value, stat) in character.stats_json" :key="stat" class="bg-white/10 rounded px-2 py-1">{{ stat }}: {{ value }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center p-6 bg-yellow-100/10 border border-yellow-300/30 rounded-lg text-yellow-900">
              <p>All premade characters are currently being used by other players in this session.</p>
              <p><strong>Please create a new character instead.</strong></p>
            </div>
          </div>

          <!-- New Character Creation -->
          <div v-if="characterType === 'new'" class="mb-8">
            <h4 class="mb-2 text-lg text-white/80">Create Your Character</h4>
            <!-- Character Form Fields -->
            <CharacterForm :name="characterName" :portraitUrl="portraitPreview" :stats="characterStats"
              submitLabel="Join Session" @submit="onCharacterFormSubmit" @cancel="onCharacterFormCancel" />
          </div>
        </div>

        <!-- Join Actions: only show for premade flow (CharacterForm has its own submit for new characters) -->
        <div v-if="characterType === 'premade'" class="flex gap-4 justify-center mt-8">
          <button type="submit" :disabled="!canJoin || isJoining"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition">
            {{ isJoining ? 'Joining...' : 'Join Session' }}
          </button>
        </div>
      </form>

      <!-- Current Players -->
      <aside v-if="currentPlayers.length > 0" class="bg-white/5 border border-white/10 rounded-lg p-6 h-fit">
        <h3 class="mb-4 text-center text-lg text-white/90">Current Players</h3>
        <div class="flex flex-col gap-3">
          <div v-for="player in currentPlayers" :key="player.id" class="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded">
            <img v-if="player.portrait_url" :src="player.portrait_url" :alt="player.name" class="w-10 h-10 rounded-full object-cover" />
            <div v-else class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/70">{{ player.name.charAt(0) }}</div>
            <span class="font-medium text-white/90">{{ player.name }}</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharacterStore } from '../../stores/character'
import { useAssetStore } from '../../stores/asset'
import { mapSession } from '../../stores/session'
import type { GameSession, SessionCharacter } from '../../types/session'
import type { CharacterStats } from '../../types/character'
import type { Database } from '../../types/supabase'
import { supabase } from '../../plugins/supabase'
import CharacterForm from '../../components/CharacterForm.vue'

const route = useRoute()
const router = useRouter()
const characterStore = useCharacterStore()
const assetStore = useAssetStore()
const loading = ref(true)
const error = ref<string | null>(null)
const session = ref<GameSession | null>(null)
const isJoining = ref(false)
const notifications = ref<{ id: number, message: string, type: 'success' | 'info' | 'warning' }[]>([])
let notificationIdCounter = 1
const characterType = ref<'new' | 'premade'>('new')
const characterName = ref('')
const selectedPremadeId = ref<string | null>(null)
const portraitPreview = ref<string | null>(null)
const characterStats = ref<CharacterStats>({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 })
const currentPlayers = ref<SessionCharacter[]>([])
// portraitAssets handled inside CharacterForm; parent no longer needs a local copy

const premadeCharacters = computed(() => {
  const usedPremadeCharacterNames = currentPlayers.value.filter(p => p.is_premade).map(p => p.name)
  return characterStore.sortedCharacters.filter(c => !usedPremadeCharacterNames.includes(c.name))
})

const canJoin = computed(() => {
  if (characterType.value === 'new') {
    return characterName.value.trim().length > 0
  } else {
    return selectedPremadeId.value !== null && premadeCharacters.value.length > 0
  }
})

function addNotification(message: string, type: 'success' | 'info' | 'warning' = 'info') {
  const notification = { id: notificationIdCounter++, message, type }
  notifications.value.push(notification)
  setTimeout(() => dismissNotification(notification.id), 5000)
}
function dismissNotification(notificationId: number) {
  const idx = notifications.value.findIndex(n => n.id === notificationId)
  if (idx > -1) notifications.value.splice(idx, 1)
}

async function loadSession() {
  try {
    loading.value = true
    error.value = null
    const sessionId = route.params.session_id as string
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions').select('*').eq('id', sessionId).single()
    if (sessionError || !sessionData) throw new Error('Session not found or has ended.')
    session.value = mapSession(sessionData)
    await loadCurrentPlayers(sessionId)
    await characterStore.fetchPremadeCharacters()
  // Ensure asset store is populated so portrait picker shows uploaded portraits
  await assetStore.fetchAssets()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load session'
  } finally {
    loading.value = false
  }
}

async function loadCurrentPlayers(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('session_characters').select('*').eq('session_id', sessionId).order('created_at')
    if (error) throw error
    currentPlayers.value = data || []
  } catch (err) {
    console.error('Failed to load current players:', err)
  }
}

// Portrait upload/selection moved into CharacterForm; parent no longer manages selected file

async function joinWithPremadeCharacter(premadeCharId: string) {
  if (!session.value || isJoining.value) return
  try {
    isJoining.value = true
    selectedPremadeId.value = premadeCharId
    characterType.value = 'premade'
    const premadeChar = premadeCharacters.value.find(c => c.id === premadeCharId)
    if (!premadeChar) throw new Error('Selected character not found')
    const characterData = {
      session_id: session.value.id,
      name: premadeChar.name,
      portrait_url: premadeChar.portrait_url,
      is_premade: true,
      character_type: 'player' as const,
      initiative_modifier: 0,
      hand_raised: false
    }
    const { data: insertedCharacter, error } = await supabase
      .from('session_characters').insert([characterData]).select().single()
    if (error) {
      if (error.code === '23505') throw new Error('A character with this name already exists in this session')
      throw error
    }
    router.push({
      name: 'join-success',
      params: { session_id: session.value.id },
      query: {
        sessionName: session.value.name,
        characterId: insertedCharacter.id,
        characterName: premadeChar.name,
        characterType: 'premade',
        characterPortrait: premadeChar.portrait_url || ''
      }
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to join session with premade character'
  } finally {
    isJoining.value = false
  }
}

async function handleJoin() {
  if (!session.value || !canJoin.value) return
  try {
    isJoining.value = true
    let characterData: Database['public']['Tables']['session_characters']['Insert']
    if (characterType.value === 'premade' && selectedPremadeId.value) {
      const premadeChar = premadeCharacters.value.find(c => c.id === selectedPremadeId.value)
      if (!premadeChar) throw new Error('Selected character not found')
      characterData = {
        session_id: session.value.id,
        name: premadeChar.name,
        portrait_url: premadeChar.portrait_url,
        is_premade: true,
        character_type: 'player',
        initiative_modifier: 0,
        hand_raised: false
      }
    } else {
  const portraitUrl = portraitPreview.value
      characterData = {
        session_id: session.value.id,
        name: characterName.value.trim(),
        portrait_url: portraitUrl,
        is_premade: false,
        character_type: 'player',
        initiative_modifier: Math.floor((characterStats.value.DEX - 10) / 2),
        hand_raised: false
      }
    }
    const { data: insertedCharacter, error } = await supabase
      .from('session_characters').insert([characterData]).select().single()
    if (error) {
      if (error.code === '23505') throw new Error('A character with this name already exists in this session')
      throw error
    }
    const characterInfo = {
      id: insertedCharacter.id,
      name: characterType.value === 'premade' && selectedPremadeId.value
        ? premadeCharacters.value.find(c => c.id === selectedPremadeId.value)?.name
        : characterName.value.trim(),
      type: characterType.value === 'premade' ? 'premade' : 'new',
      portraitUrl: characterType.value === 'premade' && selectedPremadeId.value
        ? premadeCharacters.value.find(c => c.id === selectedPremadeId.value)?.portrait_url
        : portraitPreview.value,
      isPremade: characterType.value === 'premade'
    }
    router.push({
      name: 'join-success',
      params: { session_id: session.value.id },
      query: {
        sessionName: session.value.name,
        characterId: characterInfo.id,
        characterName: characterInfo.name,
        characterType: characterInfo.type,
        characterPortrait: characterInfo.portraitUrl || ''
      }
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to join session'
  } finally {
    isJoining.value = false
  }
}

function onCharacterFormSubmit(data: { name: string, portrait_url: string | null, stats: CharacterStats }) {
  characterName.value = data.name
  portraitPreview.value = data.portrait_url
  characterStats.value = data.stats
  handleJoin()
}
function onCharacterFormCancel() {
  // Optionally reset form or close modal if needed
}

function subscribeToPlayers() {
  if (!session.value) return () => {}
  const subscription = supabase
    .channel(`join-players-${session.value.id}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'session_characters', filter: `session_id=eq.${session.value.id}`
    }, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        currentPlayers.value = [...currentPlayers.value, payload.new as SessionCharacter]
      } else if (payload.eventType === 'DELETE' && payload.old) {
        currentPlayers.value = currentPlayers.value.filter(p => p.id !== payload.old.id)
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const updated = payload.new as SessionCharacter
        currentPlayers.value = currentPlayers.value.map(p => p.id === updated.id ? updated : p)
      }
    })
    .subscribe()
  return () => subscription.unsubscribe()
}
function subscribeToSessionChanges() {
  if (!session.value) return () => {}
  const subscription = supabase
    .channel(`join-session-${session.value.id}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${session.value.id}`
    }, (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        const newSession = payload.new as GameSession
        const oldState = session.value?.state
        const newState = newSession.state
        if (oldState === 'LOBBY' && newState === 'IN_PLAY') {
          addNotification('🎮 Session has started! The adventure begins now!', 'success')
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
    .subscribe()
  return () => subscription.unsubscribe()
}

watch(premadeCharacters, (availableCharacters) => {
  if (selectedPremadeId.value && characterType.value === 'premade') {
    const isStillAvailable = availableCharacters.some(char => char.id === selectedPremadeId.value)
    if (!isStillAvailable) selectedPremadeId.value = null
  }
})

let unsubscribePlayers = () => {}
let unsubscribeSession = () => {}

onMounted(async () => {
  await loadSession()
  unsubscribePlayers = subscribeToPlayers()
  unsubscribeSession = subscribeToSessionChanges()
})
onUnmounted(() => {
  unsubscribePlayers()
  unsubscribeSession()
  if (portraitPreview.value) URL.revokeObjectURL(portraitPreview.value)
})
</script>

<style scoped>
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slideInRight {
  animation: slideInRight 0.3s ease-out;
}
</style>