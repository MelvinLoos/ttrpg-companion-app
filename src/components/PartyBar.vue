<template>
  <div class="party-bar" :class="{ 'compact': compact, 'square': square }">
    <div v-if="characters.length > 0 || true" class="party-grid">
      <!-- Left side title -->
      <div class="party-title">
        <h3>Adventuring Party</h3>
      </div>

      <!-- Right side characters -->
      <div class="party-characters">
        <div v-for="character in characters" :key="character.id" class="character-card">
          <div class="character-portrait">
            <img 
              v-if="character.portrait_url" 
              :src="character.portrait_url" 
              :alt="`${character.name}'s portrait`"
              @error="handleImageError"
            />
            <div v-else class="no-portrait">{{ character.name.charAt(0) }}</div>
          </div>
          <div class="character-info">
            <h4>{{ character.name }}</h4>
            <span class="character-type">{{ formatCharacterType(character.character_type) }}</span>
            <div v-if="character.hand_raised" class="hand-raised">✋ Question</div>
          </div>
        </div>

        <!-- QR Code for joining -->
        <div class="character-card" v-if="!hideQr">
          <div class="qr-code-container">
            <canvas ref="qrCodeCanvas" class="qr-code"></canvas>
          </div>
          <div class="character-info">
            <h4>Join Session</h4>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-party">
      <p>Waiting for adventurers to join...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import QRCode from 'qrcode'
import type { SessionCharacter } from '../types/session'
import { supabase } from '../plugins/supabase'

interface Props {
  sessionId: string
  compact?: boolean
  square?: boolean
  hideQr?: boolean
}

const props = defineProps<Props>()

// Component state
const characters = ref<SessionCharacter[]>([])
const qrCodeCanvas = ref<HTMLCanvasElement | null>(null)

// Methods
function formatCharacterType(type: string | null): string {
  switch (type) {
    case 'player': return 'Player'
    case 'npc': return 'NPC'
    case 'monster': return 'Monster'
    case null: return ''
    case undefined: return ''
    default: return type || ''
  }
}

async function loadCharacters() {
  try {
    const { data, error } = await supabase
      .from('session_characters')
      .select('*')
      .eq('session_id', props.sessionId)
      .order('created_at')

    if (error) throw error
    characters.value = data || []
  } catch (err) {
    console.error('Failed to load characters:', err)
  }
}

function subscribeToCharacterChanges() {
  const subscription = supabase
    .channel(`party-bar-${props.sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'session_characters',
      filter: `session_id=eq.${props.sessionId}`
    }, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newCharacter = payload.new as SessionCharacter
        // Check if character already exists to avoid duplicates
        if (!characters.value.find(c => c.id === newCharacter.id)) {
          characters.value = [...characters.value, newCharacter]
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const updated = payload.new as SessionCharacter
        characters.value = characters.value.map(c => 
          c.id === updated.id ? updated : c
        )
      } else if (payload.eventType === 'DELETE') {
        // Handle both payload.old and payload.new for delete events
        const deletedRecord = (payload.old || payload.new) as SessionCharacter | null
        if (deletedRecord?.id) {
          characters.value = characters.value.filter(c => c.id !== deletedRecord.id)
        }
      }
    })
    .subscribe()

  return () => subscription.unsubscribe()
}

// Image handling
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  console.warn('Failed to load portrait image in PartyBar:', img.src)
}

// QR Code generation
async function generateQRCode() {
  if (!qrCodeCanvas.value || props.hideQr) return
  
  try {
    const joinUrl = `${window.location.origin}/join/${props.sessionId}`
    await QRCode.toCanvas(qrCodeCanvas.value, joinUrl, {
      margin: 0,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (err) {
    console.error('Failed to generate QR code:', err)
  }
}

// Lifecycle
onMounted(async () => {
  await loadCharacters()
  await nextTick()
  await generateQRCode()
  const unsubscribe = subscribeToCharacterChanges()
  
  onUnmounted(() => {
    unsubscribe()
  })
})

// Watch for hideQr prop changes to regenerate QR code when it becomes visible
watch(() => props.hideQr, async (newHideQr, oldHideQr) => {
  if (oldHideQr && !newHideQr) {
    // QR code became visible, generate it
    await nextTick()
    await generateQRCode()
  }
}, { immediate: false })
</script>

<style scoped>
.party-bar {
  width: 100%;
}

.party-bar h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  color: white;
}

.party-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
  width: 100%;
}

.party-title {
  display: flex;
  align-items: center;
  justify-content: center;
}

.party-title h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  color: white;
  white-space: nowrap;
}

.party-characters {
  display: flex;
  gap: 1rem;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.character-card {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 1rem;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.qr-code-container {
  width: 95px;
  height: 95px;
  margin: 0 auto 0.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.qr-code {
  max-width: 100%;
  max-height: 100%;
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

.character-info h4 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  color: white;
}

.character-type {
  font-size: 0.9rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.7);
}

.hand-raised {
  margin-top: 0.5rem;
  color: #ffd700;
  font-weight: bold;
  font-size: 0.9rem;
}

.empty-party {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  opacity: 0.7;
  color: rgba(255, 255, 255, 0.7);
}

/* Compact mode for fitting more players */
.party-bar.compact .party-grid {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.party-bar.compact .character-card {
  padding: 0.75rem;
}

.party-bar.compact .character-portrait {
  width: 60px;
  height: 60px;
  margin: 0 auto 0.75rem;
}

.party-bar.compact .character-info h4 {
  font-size: 1rem;
  margin: 0 0 0.25rem;
}

.party-bar.compact .character-type {
  font-size: 0.8rem;
}

.party-bar.compact .no-portrait {
  font-size: 1.5rem;
}

.party-bar.compact .hand-raised {
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Square mode for horizontal layout */
.party-bar.square .party-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  justify-content: center;
}

.party-bar.square .character-card {
  padding: 0;
  width: 120px;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.party-bar.square .character-portrait {
  width: 90px;
  height: 90px;
  margin: 0 auto 0.05rem;
  flex-shrink: 0;
}

.party-bar.square .character-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: .5;
}

.party-bar.square .character-info h4 {
  font-size: 0.7rem;
  margin: 0;
  line-height: 1;
  text-align: center;
  word-break: break-word;
  padding: 0;
}

.party-bar.square .character-type {
  font-size: 0.7rem;
  display: none; /* Hide type in square mode to save space */
}

.party-bar.square .no-portrait {
  font-size: 1.5rem;
}

.party-bar.square .hand-raised {
  font-size: 0.6rem;
  margin-top: 0.05rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .party-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .party-bar.compact .party-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
  
  .party-bar.square .character-card {
    width: 85px;
    height: 85px;
    padding: 0.15rem;
  }
  
  .party-bar.square .character-portrait {
    width: 55px;
    height: 55px;
  }
  
  .party-bar.square .character-info h4 {
    font-size: 0.65rem;
  }
  
  .party-bar.square .no-portrait {
    font-size: 1.2rem;
  }
  
  .party-bar.square .qr-code-container {
    width: 55px;
    height: 55px;
    margin: 0 auto 0.1rem;
  }
}
</style>