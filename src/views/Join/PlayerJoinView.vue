<template>
  <div class="player-join">
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

    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading session...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-message">
        <h2>Session Not Found</h2>
        <p>{{ error }}</p>
        <button @click="$router.push('/gm')" class="back-btn">Go to GM Panel</button>
      </div>
    </div>

    <!-- Join Form -->
    <div v-else-if="session" class="join-form">
      <!-- Session Header -->
      <header class="session-header">
        <h1>Join {{ session.name }}</h1>
        <p v-if="session.teaser_text" class="session-description">{{ session.teaser_text }}</p>
      </header>

      <!-- Character Creation Form -->
      <form @submit.prevent="handleJoin" class="character-form">
        <div class="form-section">
          <h3>Character Selection</h3>
          
          <!-- Character Type Selection -->
          <div class="character-type-selection">
            <label class="radio-option">
              <input 
                type="radio" 
                v-model="characterType" 
                value="new" 
                name="characterType"
              />
              <span class="radio-label">Create New Character</span>
            </label>
            <label class="radio-option" v-if="characterStore.sortedCharacters.length > 0">
              <input 
                type="radio" 
                v-model="characterType" 
                value="premade" 
                name="characterType"
              />
              <span class="radio-label">Choose Premade Character</span>
            </label>
          </div>

          <!-- Premade Character Selection -->
          <div v-if="characterType === 'premade'" class="premade-selection">
            <h4>Select a Character</h4>
            <p class="selection-hint">Click to select, double-click to join immediately</p>
            <div v-if="premadeCharacters.length > 0" class="character-grid">
              <div 
                v-for="character in premadeCharacters" 
                :key="character.id"
                :class="['character-card', { selected: selectedPremadeId === character.id }]"
                @click="selectedPremadeId = character.id"
                @dblclick="joinWithPremadeCharacter(character.id)"
              >
                <div class="character-portrait">
                  <img 
                    v-if="character.portrait_url" 
                    :src="character.portrait_url" 
                    :alt="character.name"
                  />
                  <div v-else class="no-portrait">{{ character.name.charAt(0) }}</div>
                </div>
                <div class="character-info">
                  <h5>{{ character.name }}</h5>
                  <div v-if="character.stats_json" class="stats-preview">
                    <span v-for="(value, stat) in character.stats_json" :key="stat" class="stat">
                      {{ stat }}: {{ value }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-characters-available">
              <p>All premade characters are currently being used by other players in this session.</p>
              <p><strong>Please create a new character instead.</strong></p>
            </div>
          </div>

          <!-- New Character Creation -->
          <div v-if="characterType === 'new'" class="new-character">
            <h4>Create Your Character</h4>
            
            <div class="form-group">
              <label for="character-name">Character Name</label>
              <input 
                id="character-name"
                v-model="characterName"
                type="text"
                required
                placeholder="Enter your character's name"
                :disabled="isJoining"
              />
            </div>

            <div class="form-group">
              <label for="character-portrait">Character Portrait (Optional)</label>
              <div class="portrait-upload">
                <div v-if="portraitPreview" class="portrait-preview">
                  <img :src="portraitPreview" alt="Character portrait preview" />
                  <button type="button" @click="clearPortrait" class="clear-btn">×</button>
                </div>
                <div v-else class="no-portrait-preview">
                  <span>No portrait selected</span>
                </div>
                <input
                  id="character-portrait"
                  type="file"
                  accept="image/*"
                  @change="handlePortraitChange"
                  :disabled="isJoining"
                />
              </div>
            </div>

            <!-- Basic Stats (Optional - simplified for quick join) -->
            <div class="form-group">
              <label>Quick Stats (Optional)</label>
              <div class="stats-grid">
                <div v-for="stat in ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']" :key="stat" class="stat-input">
                  <label :for="`stat-${stat}`">{{ stat }}</label>
                  <input
                    :id="`stat-${stat}`"
                    v-model.number="characterStats[stat as keyof CharacterStats]"
                    type="number"
                    min="3"
                    max="18"
                    :disabled="isJoining"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Join Actions -->
        <div class="form-actions">
          <button 
            type="submit" 
            :disabled="!canJoin || isJoining"
            class="join-btn"
          >
            {{ isJoining ? 'Joining...' : 'Join Session' }}
          </button>
        </div>
      </form>

      <!-- Current Players -->
      <aside class="current-players" v-if="currentPlayers.length > 0">
        <h3>Current Players</h3>
        <div class="player-list">
          <div v-for="player in currentPlayers" :key="player.id" class="player-card">
            <img 
              v-if="player.portrait_url" 
              :src="player.portrait_url" 
              :alt="player.name"
              class="player-portrait"
            />
            <div v-else class="player-initial">{{ player.name.charAt(0) }}</div>
            <span class="player-name">{{ player.name }}</span>
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
import { mapSession } from '../../stores/session'
import type { GameSession, SessionCharacter } from '../../types/session'
import type { CharacterStats } from '../../types/character'
import type { Database } from '../../types/supabase'
import { supabase } from '../../plugins/supabase'

// Router and stores
const route = useRoute()
const router = useRouter()
const characterStore = useCharacterStore()

// Component state
const loading = ref(true)
const error = ref<string | null>(null)
const session = ref<GameSession | null>(null)
const isJoining = ref(false)

// Notification state
const notifications = ref<{id: number, message: string, type: 'success' | 'info' | 'warning'}[]>([])
let notificationIdCounter = 1

// Character creation state
const characterType = ref<'new' | 'premade'>('new')
const characterName = ref('')
const selectedPremadeId = ref<string | null>(null)
const selectedPortrait = ref<File | null>(null)
const portraitPreview = ref<string | null>(null)
const characterStats = ref<CharacterStats>({
  STR: 10,
  DEX: 10,
  CON: 10,
  INT: 10,
  WIS: 10,
  CHA: 10
})

// Current players in session
const currentPlayers = ref<SessionCharacter[]>([])

// Computed properties
const premadeCharacters = computed(() => {
  // Filter out premade characters that are already in use in this session
  const usedPremadeCharacterNames = currentPlayers.value
    .filter(player => player.is_premade)
    .map(player => player.name)
  
  return characterStore.sortedCharacters.filter(
    character => !usedPremadeCharacterNames.includes(character.name)
  )
})

const canJoin = computed(() => {
  if (characterType.value === 'new') {
    return characterName.value.trim().length > 0
  } else {
    // For premade characters, both a selection and available characters are required
    return selectedPremadeId.value !== null && premadeCharacters.value.length > 0
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
async function loadSession() {
  try {
    loading.value = true
    error.value = null

    const sessionId = route.params.session_id as string
    
    // Fetch session details
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      throw new Error('Session not found or has ended.')
    }

    session.value = mapSession(sessionData)

    // Load current players
    await loadCurrentPlayers(sessionId)

    // Load premade characters
    await characterStore.fetchPremadeCharacters()

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load session'
  } finally {
    loading.value = false
  }
}

async function loadCurrentPlayers(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('session_characters')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at')

    if (error) throw error
    currentPlayers.value = data || []
  } catch (err) {
    console.error('Failed to load current players:', err)
  }
}

function handlePortraitChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    const file = input.files[0]
    if (file) {
      selectedPortrait.value = file
      portraitPreview.value = URL.createObjectURL(file)
    }
  }
}

function clearPortrait() {
  selectedPortrait.value = null
  if (portraitPreview.value) {
    URL.revokeObjectURL(portraitPreview.value)
  }
  portraitPreview.value = null
}

async function uploadPortrait() {
  if (!selectedPortrait.value) return null

  try {
    const fileExt = selectedPortrait.value.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('portraits')
      .upload(fileName, selectedPortrait.value)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('portraits')
      .getPublicUrl(fileName)

    return data.publicUrl
  } catch (error) {
    console.error('Failed to upload portrait:', error)
    return null
  }
}

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

    // Insert character into session
    const { data: insertedCharacter, error } = await supabase
      .from('session_characters')
      .insert([characterData])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('A character with this name already exists in this session')
      }
      throw error
    }

    // Navigate to success page
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
      // Join with premade character
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
      // Create new character
      const portraitUrl = await uploadPortrait()
      
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

    // Insert character into session
    const { data: insertedCharacter, error } = await supabase
      .from('session_characters')
      .insert([characterData])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('A character with this name already exists in this session')
      }
      throw error
    }

    // Navigate to success page with character ID for proper deletion
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

function subscribeToPlayers() {
  if (!session.value) return () => {}

  const subscription = supabase
    .channel(`join-players-${session.value.id}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'session_characters',
      filter: `session_id=eq.${session.value.id}`
    }, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        currentPlayers.value = [...currentPlayers.value, payload.new as SessionCharacter]
      } else if (payload.eventType === 'DELETE' && payload.old) {
        currentPlayers.value = currentPlayers.value.filter(p => p.id !== payload.old.id)
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const updated = payload.new as SessionCharacter
        currentPlayers.value = currentPlayers.value.map(p => 
          p.id === updated.id ? updated : p
        )
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
      event: '*',
      schema: 'public',
      table: 'sessions',
      filter: `id=eq.${session.value.id}`
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
    .subscribe()

  return () => subscription.unsubscribe()
}

// Watch for changes to available premade characters and reset selection if needed
watch(premadeCharacters, (availableCharacters) => {
  // If a premade character was selected but is no longer available, reset the selection
  if (selectedPremadeId.value && characterType.value === 'premade') {
    const isStillAvailable = availableCharacters.some(char => char.id === selectedPremadeId.value)
    if (!isStillAvailable) {
      selectedPremadeId.value = null
    }
  }
})

// Lifecycle
onMounted(async () => {
  await loadSession()
  const unsubscribePlayers = subscribeToPlayers()
  const unsubscribeSession = subscribeToSessionChanges()
  
  onUnmounted(() => {
    unsubscribePlayers()
    unsubscribeSession()
    if (portraitPreview.value) {
      URL.revokeObjectURL(portraitPreview.value)
    }
  })
})
</script>

<style scoped>
.player-join {
  min-height: 100vh;
  padding: 0.5rem;
  background-color: #242424;
  color: rgba(255, 255, 255, 0.87);
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.error-message {
  text-align: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  padding: 2rem;
  max-width: 400px;
}

.error-message h2 {
  margin: 0 0 1rem;
  color: #fecaca;
}

.back-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.join-form {
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  padding: 1rem;
}

.session-header {
  grid-column: 1 / -1;
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.session-header h1 {
  margin: 0 0 1rem;
  font-size: 2.5rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.87);
}

.session-description {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.character-form {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.form-section h3 {
  margin: 0 0 1.5rem;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
}

.character-type-selection {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
}

.radio-option:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.radio-option input[type="radio"] {
  margin: 0;
}

.premade-selection,
.new-character {
  margin-bottom: 2rem;
}

.premade-selection h4,
.new-character h4 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
}

.selection-hint {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin: -0.5rem 0 1rem;
  text-align: center;
  font-style: italic;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.character-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  user-select: none;
}

.character-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.character-card.selected {
  border-color: #60a5fa;
  background: rgba(96, 165, 250, 0.15);
}

.character-portrait {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 1rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
}

.character-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-portrait {
  font-size: 2rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.5);
}

.character-info h5 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
}

.stats-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.stat {
  padding: 0.2rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 0.2rem;
  text-align: center;
}

.no-characters-available {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 0.5rem;
  color: rgba(255, 193, 7, 0.9);
}

.no-characters-available p {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.no-characters-available p:last-child {
  margin: 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.87);
  font-size: 0.9rem;
}

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus {
  outline: none;
  border-color: #646cff;
  background: rgba(255, 255, 255, 0.08);
}

.form-group input[type="text"]::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.portrait-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.portrait-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
}

.portrait-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.clear-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.8);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.no-portrait-preview {
  width: 120px;
  height: 120px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-input {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-input label {
  font-size: 0.8rem;
  text-align: center;
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
}

.stat-input input {
  text-align: center;
  padding: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.join-btn {
  padding: 0.6rem 1.5rem;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: rgba(255, 255, 255, 0.87);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.join-btn:hover:not(:disabled) {
  border-color: #646cff;
  background: rgba(255, 255, 255, 0.05);
}

.join-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: rgba(255, 255, 255, 0.87);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.current-players {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1.5rem;
  height: fit-content;
}

.current-players h3 {
  margin: 0 0 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
}

.player-portrait {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.player-initial {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
}

.player-name {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.87);
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
  .join-form {
    grid-template-columns: 1fr;
    max-width: 500px;
  }

  .character-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-actions {
    flex-direction: column;
  }

  .session-header h1 {
    font-size: 2rem;
  }
}
</style>