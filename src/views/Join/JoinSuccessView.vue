<template>
  <div class="join-success">
    <div class="success-card">
      <div class="success-icon">✅</div>
      <h1>Joined Successfully!</h1>
      <p>You're now part of <strong>{{ sessionName }}</strong></p>
      
      <div class="character-info">
        <div class="character-details">
          <div class="character-portrait">
            <img 
              v-if="characterPortrait" 
              :src="characterPortrait" 
              :alt="`${characterName}'s portrait`"
              @error="handleImageError"
            />
            <div v-else class="no-portrait">
              {{ characterName.charAt(0).toUpperCase() }}
            </div>
          </div>
          <div class="character-name-info">
            <strong>{{ characterName }}</strong>
          </div>
        </div>
      </div>

      <div class="actions">
        <button 
          @click="leaveSession"
          @mousedown="() => console.log('Button mousedown event triggered')"
          @mouseup="() => console.log('Button mouseup event triggered')"
          :disabled="!characterId || isLeaving"
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {{ isLeaving ? 'Leaving...' : 'Leave Session' }}
        </button>
      </div>
    </div>
  </div>
</template><script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../plugins/supabase'

const route = useRoute()
const router = useRouter()
const isLeaving = ref(false)

const sessionName = route.query.sessionName as string || 'the session'
const sessionId = route.params.session_id as string
const characterId = route.query.characterId as string
const characterName = route.query.characterName as string || 'Unknown Character'
const characterPortrait = route.query.characterPortrait as string || null

// Debug logging on component mount
onMounted(() => {
  console.log('JoinSuccessView mounted with route data:')
  console.log('- Route params:', route.params)
  console.log('- Route query:', route.query)
  console.log('- Session ID:', sessionId)
  console.log('- Character ID:', characterId)
  console.log('- Character Name:', characterName)
})

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  console.warn('Failed to load character portrait:', img.src)
}

async function leaveSession() {
  console.log('=== leaveSession function called ===')
  console.log('Starting leave session process...')
  console.log('Character ID:', characterId)
  console.log('Session ID:', sessionId)
  
  if (!characterId) {
    console.error('No character ID found, cannot leave session')
    alert('Error: No character information found')
    return
  }

  try {
    isLeaving.value = true
    console.log('Set isLeaving to true, button should show "Leaving..."')
    
    console.log('Attempting to delete character from database...')
    const { error } = await supabase
      .from('session_characters')
      .delete()
      .eq('id', characterId)

    console.log('Database delete result - error:', error)
    
    if (error) {
      console.error('Database error when leaving session:', error)
      throw error
    }
    
    console.log('Character successfully deleted from database')
    console.log('Navigating back to player join screen...')
    
    await router.push(`/join/${sessionId}`)
    console.log('Navigation complete')
  } catch (error) {
    console.error('Error leaving session:', error)
    alert(`Failed to leave session: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    isLeaving.value = false
    console.log('Set isLeaving to false')
    console.log('=== leaveSession function completed ===')
  }
}
</script>

<style scoped>
.join-success {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #242424;
  color: rgba(255, 255, 255, 0.87);
  padding: 1rem;
}

.success-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

.success-card h1 {
  margin: 0 0 0.75rem;
  font-size: 2rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.87);
}

.success-card p {
  font-size: 1.1rem;
  margin: 0 0 1.5rem;
  color: rgba(255, 255, 255, 0.7);
}

.character-info {
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin: 1.5rem 0;
  text-align: center;
}

.character-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.character-portrait {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(96, 165, 250, 0.3);
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

.character-name-info {
  text-align: center;
}

.character-name-info strong {
  font-size: 1.2rem;
  color: rgba(96, 165, 250, 0.9);
}

.actions {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .success-card {
    padding: 1.5rem;
    margin: 0.5rem;
  }

  .success-card h1 {
    font-size: 1.8rem;
  }
  
  .character-portrait {
    width: 70px;
    height: 70px;
  }
  
  .no-portrait {
    font-size: 1.8rem;
  }
}

/* Make sure it fits on smaller screens */
@media (max-height: 700px) {
  .success-card {
    padding: 1.5rem;
  }
  
  .success-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }
  
  .success-card h1 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }
  
  .character-info {
    margin: 1rem 0;
    padding: 1rem;
  }
  
  .character-portrait {
    width: 60px;
    height: 60px;
  }
  
  .no-portrait {
    font-size: 1.5rem;
  }
}
</style>