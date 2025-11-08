<template>
  <div class="party-bar">
    <h3>Adventuring Party</h3>
    <div v-if="characters.length > 0" class="party-grid">
      <div v-for="character in characters" :key="character.id" class="character-card">
        <div class="character-portrait">
          <img 
            v-if="character.portrait_url" 
            :src="character.portrait_url" 
            :alt="`${character.name}'s portrait`"
          />
          <div v-else class="no-portrait">{{ character.name.charAt(0) }}</div>
        </div>
        <div class="character-info">
          <h4>{{ character.name }}</h4>
          <span class="character-type">{{ formatCharacterType(character.character_type) }}</span>
          <div v-if="character.hand_raised" class="hand-raised">✋ Question</div>
        </div>
      </div>
    </div>
    <div v-else class="empty-party">
      <p>Waiting for adventurers to join...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { SessionCharacter } from '../types/session'
import { supabase } from '../plugins/supabase'

interface Props {
  sessionId: string
}

const props = defineProps<Props>()

// Component state
const characters = ref<SessionCharacter[]>([])

// Methods
function formatCharacterType(type: string): string {
  switch (type) {
    case 'player': return 'Player'
    case 'npc': return 'NPC'
    case 'monster': return 'Monster'
    default: return type
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
        characters.value = [...characters.value, payload.new as SessionCharacter]
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const updated = payload.new as SessionCharacter
        characters.value = characters.value.map(c => 
          c.id === updated.id ? updated : c
        )
      } else if (payload.eventType === 'DELETE' && payload.old) {
        characters.value = characters.value.filter(c => c.id !== payload.old.id)
      }
    })
    .subscribe()

  return () => subscription.unsubscribe()
}

// Lifecycle
onMounted(async () => {
  await loadCharacters()
  const unsubscribe = subscribeToCharacterChanges()
  
  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<style scoped>
.party-bar {
  width: 100%;
}

.party-bar h3 {
  margin: 0 0 2rem;
  font-size: 1.5rem;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  color: white;
}

.party-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.character-card {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 1rem;
  padding: 1rem;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
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

/* Responsive design */
@media (max-width: 768px) {
  .party-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}
</style>