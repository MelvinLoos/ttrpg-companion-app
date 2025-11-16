<template>
  <div class="sessions-view min-h-screen bg-stone-900 text-stone-100">
    <header class="sessions-header bg-stone-900 text-stone-100 border-b p-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white">Game Sessions</h1>
          <p class="text-stone-400 mt-1">Manage your game sessions and keep track of your campaigns</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3"></div>
          <button class="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg" @click="showCreateDialog = true">
            Create New Session
          </button>
        </div>
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
          <div class="session-preview">
            <img 
              v-if="session.active_image_url" 
              :src="session.active_image_url" 
              :alt="session.name"
              class="session-image"
            />
            <div v-else class="no-image">No Image Set</div>
          </div>
          <div class="session-info">
            <h3>{{ session.name }}</h3>
            <p v-if="session.teaser_text" class="teaser">{{ session.teaser_text }}</p>
            <p class="meta">Created {{ formatDate(session.created_at || '') }}</p>
          </div>
          <div class="session-actions">
            <button @click="editSession(session)" class="edit-btn">Edit</button>
            <button @click="deleteSessionConfirm(session.id)" class="delete-btn">Delete</button>
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
          <div class="form-group">
            <label>Active Image (optional)</label>
            <div class="asset-selector">
              <div v-if="formData.active_image_url" class="selected-asset">
                <img :src="formData.active_image_url" alt="Selected image" />
                <button type="button" @click="clearSelectedImage" class="clear-btn">✕</button>
              </div>
              <div v-else class="no-asset-selected">
                <p>No image selected</p>
              </div>
              <button type="button" @click="showAssetPicker = !showAssetPicker" class="select-asset-btn">
                {{ formData.active_image_url ? 'Change Image' : 'Select Image' }}
              </button>
            </div>
            
            <!-- Asset picker dropdown -->
            <div v-if="showAssetPicker" class="asset-picker">
              <div class="asset-grid">
                <div 
                  v-for="asset in availableAssets" 
                  :key="asset.id"
                  :class="['asset-item', { selected: formData.active_image_url === asset.public_url }]"
                  @click="selectAsset(asset)"
                >
                  <img :src="asset.public_url || ''" :alt="asset.friendly_name || 'Asset'" />
                  <p>{{ asset.friendly_name || 'Unnamed' }}</p>
                </div>
              </div>
              <p v-if="availableAssets.length === 0" class="no-assets">
                No assets available. <router-link to="/gm/assets">Upload some assets</router-link> first.
              </p>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeDialog">Cancel</button>
            <button type="submit" :disabled="store.state.loading">
              {{ editingSession ? 'Save Changes' : 'Create Session' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSessionStore } from '../../stores/session'
import { useAssetStore, type Asset } from '../../stores/asset'
import type { GameSession } from '../../types/session'

// Store setup
const store = useSessionStore()
const assetStore = useAssetStore()

// Component state
const showCreateDialog = ref(false)
const showAssetPicker = ref(false)
const editingSession = ref<GameSession | null>(null)
const formData = ref({
  name: '',
  teaser_text: '',
  active_image_url: null as string | null
})

// Computed properties
const availableAssets = computed(() => 
  [...assetStore.assetsByType.scenes, ...assetStore.assetsByType.maps]
)

// Methods
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function editSession(session: GameSession) {
  editingSession.value = session
  formData.value = {
    name: session.name,
    teaser_text: session.teaser_text || '',
    active_image_url: session.active_image_url
  }
  showCreateDialog.value = true
}

function closeDialog() {
  showCreateDialog.value = false
  showAssetPicker.value = false
  editingSession.value = null
  formData.value = {
    name: '',
    teaser_text: '',
    active_image_url: null
  }
}

function clearSelectedImage() {
  formData.value.active_image_url = null
  showAssetPicker.value = false
}

function selectAsset(asset: Asset) {
  formData.value.active_image_url = asset.public_url
  showAssetPicker.value = false
}

async function handleSubmit() {
  if (editingSession.value) {
    await store.updateSession(editingSession.value.id, formData.value)
  } else {
    await store.createSession(formData.value.name, formData.value.teaser_text, formData.value.active_image_url)
  }
  closeDialog()
}

async function deleteSessionConfirm(id: string) {
  if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
    await store.deleteSession(id)
  }
}

// Lifecycle
onMounted(() => {
  store.fetchSessions()
  assetStore.fetchAssets()
  const unsubscribe = store.subscribeToChanges()
  onUnmounted(unsubscribe)
})
</script>

<style scoped>
.create-btn {
  cursor: pointer;
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
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.session-card {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-preview {
  aspect-ratio: 16/9;
  border-radius: 0.25rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.session-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.session-info h3 {
  margin: 0 0 0.5rem;
}

.session-info p {
  margin: 0;
  font-size: 0.9rem;
}

.session-info .teaser {
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.session-info .meta {
  opacity: 0.6;
  font-size: 0.8rem;
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

.session-actions button.delete-btn {
  background: rgba(255, 0, 0, 0.1);
  border-color: rgba(255, 0, 0, 0.2);
}

.session-actions button.delete-btn:hover {
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

/* Asset Selector Styles */
.asset-selector {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  overflow: hidden;
}

.selected-asset {
  position: relative;
  aspect-ratio: 16/9;
  max-width: 300px;
}

.selected-asset img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.clear-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.clear-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.no-asset-selected {
  padding: 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.no-asset-selected p {
  margin: 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.select-asset-btn {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
}

.select-asset-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.asset-picker {
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.2);
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  padding: 1rem;
}

.asset-item {
  aspect-ratio: 16/9;
  border-radius: 0.25rem;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
}

.asset-item:hover {
  border-color: rgba(59, 130, 246, 0.5);
}

.asset-item.selected {
  border-color: rgba(59, 130, 246, 0.8);
  background: rgba(59, 130, 246, 0.1);
}

.asset-item img {
  width: 100%;
  height: 80%;
  object-fit: cover;
}

.asset-item p {
  margin: 0;
  padding: 0.25rem;
  font-size: 0.7rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.8);
}

.no-assets {
  padding: 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.no-assets a {
  color: rgba(59, 130, 246, 0.8);
  text-decoration: none;
}

.no-assets a:hover {
  color: rgba(59, 130, 246, 1);
  text-decoration: underline;
}
</style>