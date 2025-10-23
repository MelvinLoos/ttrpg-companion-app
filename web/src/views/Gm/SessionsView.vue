<template>
  <div class="sessions-view">
    <header class="sessions-header">
      <h2>Game Sessions</h2>
      <button class="create-btn" @click="showCreateDialog = true">
        Create New Session
      </button>
    </header>

    <div class="sessions-grid">
      <div v-if="store.state.loading" class="loading">
        <p>Loading sessions...</p>
      </div>
      <div v-else-if="store.state.error" class="error">
        <p>{{ store.state.error }}</p>
      </div>
      <div v-else-if="store.activeSessions.length === 0" class="no-sessions">
        <p>No sessions created yet. Click 'Create New Session' to get started.</p>
      </div>
      <div v-else class="sessions-list">
        <div v-for="session in store.activeSessions" :key="session.id" class="session-card">
          <div class="session-info">
            <h3>{{ session.name }}</h3>
            <p v-if="session.teaser_text">{{ session.teaser_text }}</p>
          </div>
          <div class="session-actions">
            <button @click="editSession(session)">Edit</button>
            <button @click="deleteSession(session.id)" class="delete">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit session dialog -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-content">
        <h3>{{ editingSession ? 'Edit Session' : 'Create New Session' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="session-name">Session Name</label>
            <input 
              id="session-name"
              v-model="formData.name"
              type="text"
              required
              placeholder="Enter session name"
            />
          </div>
          <div class="form-group">
            <label for="session-teaser">Teaser Text (optional)</label>
            <textarea
              id="session-teaser"
              v-model="formData.teaser_text"
              rows="3"
              placeholder="Enter a brief description or teaser"
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeDialog">Cancel</button>
            <button type="submit">{{ editingSession ? 'Save Changes' : 'Create Session' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSessionStore } from '../../stores/session'
import type { GameSession } from '../../types/session'

// Store setup
const store = useSessionStore()

// Component state
const showCreateDialog = ref(false)
const editingSession = ref<GameSession | null>(null)
const formData = ref({
  name: '',
  teaser_text: ''
})

// Methods
function editSession(session: GameSession) {
  editingSession.value = session
  formData.value = {
    name: session.name,
    teaser_text: session.teaser_text || ''
  }
  showCreateDialog.value = true
}

function closeDialog() {
  showCreateDialog.value = false
  editingSession.value = null
  formData.value = {
    name: '',
    teaser_text: ''
  }
}

async function handleSubmit() {
  if (editingSession.value) {
    await store.updateSession(editingSession.value.id, formData.value)
  } else {
    await store.createSession(formData.value.name, formData.value.teaser_text)
  }
  closeDialog()
}

async function deleteSession(id: string) {
  if (confirm('Are you sure you want to delete this session?')) {
    await store.deleteSession(id)
  }
}

// Lifecycle
onMounted(() => {
  store.fetchSessions()
  const unsubscribe = store.subscribeToChanges()
  onUnmounted(unsubscribe)
})
</script>

<style scoped>
.sessions-view {
  padding: 1rem;
}

.sessions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.create-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
}

.create-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.sessions-grid {
  display: grid;
  gap: 1rem;
}

.no-sessions {
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

.sessions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.session-card {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
}

.session-info h3 {
  margin: 0 0 0.5rem;
}

.session-info p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.session-actions {
  display: flex;
  gap: 0.5rem;
}

.session-actions button {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
}

.session-actions button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.session-actions button.delete {
  background: rgba(255, 0, 0, 0.1);
  border-color: rgba(255, 0, 0, 0.2);
}

.session-actions button.delete:hover {
  background: rgba(255, 0, 0, 0.2);
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-content {
  background: #1a1a1a;
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-content h3 {
  margin: 0 0 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.form-actions button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
}

.form-actions button[type="submit"] {
  background: rgba(59, 130, 246, 0.5);
  border-color: rgba(59, 130, 246, 0.8);
}

.form-actions button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.form-actions button[type="submit"]:hover {
  background: rgba(59, 130, 246, 0.7);
}
</style>