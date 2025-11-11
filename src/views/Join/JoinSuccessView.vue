<template>
  <div class="join-success">
    <div class="success-card">
      <div class="success-icon">✅</div>
      <h1>Welcome to the Session!</h1>
      <p>You've successfully joined <strong>{{ sessionName }}</strong></p>
      
      <div class="character-info">
        <h3>Your Character</h3>
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
            <span class="character-type">({{ characterType === 'premade' ? 'Premade Character' : 'New Character' }})</span>
          </div>
        </div>
      </div>
      
      <div class="next-steps">
        <h3>What's Next?</h3>
        <ul>
          <li>Wait for the GM to start the session</li>
          <li>Your character will appear on the main screen</li>
          <li>Follow along with the adventure</li>
          <li>Have fun and enjoy the game!</li>
        </ul>
      </div>

      <div class="session-info">
        <p>The GM will control the main display and guide the session. Sit back and enjoy the adventure!</p>
      </div>

      <div class="actions">
        <button @click="leaveSession" class="leave-btn">
          ← Leave Session
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../plugins/supabase'

const route = useRoute()
const router = useRouter()

const sessionName = route.query.sessionName as string || 'the session'
const sessionId = route.params.session_id as string
const characterId = route.query.characterId as string
const characterName = route.query.characterName as string || 'Unknown Character'
const characterType = route.query.characterType as string || 'new'
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
  console.log('Leave Session clicked!')
  console.log('Character ID:', characterId)
  console.log('Session ID:', sessionId)
  console.log('Character Name:', characterName)
  
  const confirmLeave = confirm(`Are you sure you want to leave this session? Your character "${characterName}" will be removed from the session.`)
  if (!confirmLeave) {
    console.log('User cancelled leave session')
    return
  }
  
  if (!characterId) {
    console.error('No character ID found!')
    alert('Error: No character ID found. Cannot remove character from session.')
    return
  }
  
  try {
    console.log('Attempting to delete character with ID:', characterId)
    
    // Remove the character from the session using the character ID
    const { error, data } = await supabase
      .from('session_characters')
      .delete()
      .eq('id', characterId)
      .select()
    
    console.log('Delete result:', { error, data })
    
    if (error) {
      console.error('Failed to remove character:', error)
      alert('Failed to remove your character from the session. Please try again or contact the GM.')
      return
    }
    
    console.log('Character deleted successfully, navigating back...')
    // Navigate back to the join page
    router.push(`/join/${sessionId}`)
  } catch (error) {
    console.error('Failed to leave session:', error)
    alert('An error occurred while leaving the session. Please try again.')
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
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.success-card h1 {
  margin: 0 0 1rem;
  font-size: 2.5rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.87);
}

.success-card p {
  font-size: 1.2rem;
  margin: 0 0 2rem;
  color: rgba(255, 255, 255, 0.7);
}

.character-info {
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 2rem 0;
  text-align: center;
}

.character-info h3 {
  margin: 0 0 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
}

.character-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.character-portrait {
  width: 100px;
  height: 100px;
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
  font-size: 2.5rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
}

.character-name-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  text-align: center;
}

.character-name-info strong {
  font-size: 1.3rem;
  color: rgba(96, 165, 250, 0.9);
}

.character-type {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

.next-steps {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 2rem 0;
  text-align: left;
}

.next-steps h3 {
  margin: 0 0 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
}

.next-steps ul {
  margin: 0;
  padding-left: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.next-steps li {
  margin-bottom: 0.5rem;
}

.session-info {
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 2rem 0;
  text-align: center;
}

.session-info p {
  margin: 0;
  color: rgba(96, 165, 250, 0.9);
  font-size: 1rem;
}

.actions {
  display: flex;
  justify-content: center;
}

.leave-btn {
  padding: 0.6rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: rgba(255, 255, 255, 0.87);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.leave-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .success-card {
    padding: 2rem;
  }

  .success-card h1 {
    font-size: 2rem;
  }
}
</style>