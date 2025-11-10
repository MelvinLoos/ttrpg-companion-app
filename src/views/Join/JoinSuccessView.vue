<template>
  <div class="join-success">
    <div class="success-card">
      <div class="success-icon">✅</div>
      <h1>Welcome to the Session!</h1>
      <p>You've successfully joined <strong>{{ sessionName }}</strong></p>
      
      <div class="next-steps">
        <h3>What's Next?</h3>
        <ul>
          <li>Wait for the GM to start the session</li>
          <li>Your character will appear on the main screen</li>
          <li>Raise your hand if you have questions</li>
        </ul>
      </div>

      <div class="actions">
        <button @click="goToPlayerScreen" class="screen-btn">
          📺 View Player Screen
        </button>
        <button @click="$router.push('/gm')" class="gm-btn">
          🎲 Go to GM Panel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const sessionName = route.query.sessionName as string || 'the session'
const sessionId = route.params.session_id as string

function goToPlayerScreen() {
  router.push(`/screen/${sessionId}`)
}
</script>

<style scoped>
.join-success {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 1rem;
}

.success-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.success-card h1 {
  margin: 0 0 1rem;
  font-size: 2.5rem;
  font-weight: bold;
}

.success-card p {
  font-size: 1.2rem;
  margin: 0 0 2rem;
  opacity: 0.9;
}

.next-steps {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0;
  text-align: left;
}

.next-steps h3 {
  margin: 0 0 1rem;
  text-align: center;
}

.next-steps ul {
  margin: 0;
  padding-left: 1.5rem;
}

.next-steps li {
  margin-bottom: 0.5rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.screen-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(45deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.screen-btn:hover {
  background: linear-gradient(45deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
}

.gm-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.gm-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .success-card {
    padding: 2rem;
  }

  .success-card h1 {
    font-size: 2rem;
  }

  .actions {
    flex-direction: column;
  }
}
</style>