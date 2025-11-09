<template>
  <div class="player-join">
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
            <label class="radio-option" v-if="premadeCharacters.length > 0">
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
          <div v-if="characterType === 'premade' && premadeCharacters.length > 0" class="premade-selection">
            <h4>Select a Character</h4>
            <div class="character-grid">
              <div 
                v-for="character in premadeCharacters" 
                :key="character.id"
                :class="['character-card', { selected: selectedPremadeId === character.id }]"
                @click="selectedPremadeId = character.id"
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
          <button 
            type="button" 
            @click="$router.push('/gm')"
            :disabled="isJoining"
            class="cancel-btn"
          >
            Cancel
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharacterStore } from '../../stores/character'
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
const premadeCharacters = computed(() => characterStore.sortedCharacters)

const canJoin = computed(() => {
  if (characterType.value === 'new') {
    return characterName.value.trim().length > 0
  } else {
    return selectedPremadeId.value !== null
  }
})

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

    session.value = sessionData

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
    const { error } = await supabase
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
      query: { sessionName: session.value.name }
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

// Lifecycle
onMounted(async () => {
  await loadSession()
  const unsubscribe = subscribeToPlayers()
  
  onUnmounted(() => {
    unsubscribe()
    if (portraitPreview.value) {
      URL.revokeObjectURL(portraitPreview.value)
    }
  })
})
</script>

<style scoped>
.player-join {
  min-height: 100vh;
  padding: 1rem;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
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
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 0.25rem;
  cursor: pointer;
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
}

.session-header {
  grid-column: 1 / -1;
  text-align: center;
  margin-bottom: 2rem;
}

.session-header h1 {
  margin: 0 0 1rem;
  font-size: 2.5rem;
  font-weight: bold;
}

.session-description {
  font-size: 1.2rem;
  opacity: 0.8;
  margin: 0;
}

.character-form {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.form-section h3 {
  margin: 0 0 1.5rem;
  font-size: 1.5rem;
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
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.radio-option:hover {
  background: rgba(255, 255, 255, 0.1);
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
  font-size: 1.2rem;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.character-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.character-card:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
}

.character-card.selected {
  border-color: #60a5fa;
  background: rgba(96, 165, 250, 0.2);
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
  color: rgba(255, 255, 255, 0.7);
}

.character-info h5 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.stats-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.stat {
  padding: 0.2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.2rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
}

.form-group input[type="text"]::placeholder {
  color: rgba(255, 255, 255, 0.5);
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
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
  opacity: 0.7;
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
}

.stat-input input {
  text-align: center;
  padding: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.join-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(45deg, #10b981, #059669);
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.join-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, #059669, #047857);
  transform: translateY(-2px);
}

.join-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.current-players {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  height: fit-content;
}

.current-players h3 {
  margin: 0 0 1rem;
  text-align: center;
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
  border-radius: 0.5rem;
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
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.player-name {
  font-weight: 500;
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
}
</style>