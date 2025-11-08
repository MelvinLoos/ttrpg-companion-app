<template>
  <div class="characters-view">
    <header class="characters-header">
      <h2>Premade Characters</h2>
      <button class="create-btn" @click="showCreateDialog = true">
        Create Character
      </button>
    </header>

    <div class="characters-grid">
      <div v-if="store.state.loading" class="loading">
        <p>Loading characters...</p>
      </div>
      <div v-else-if="store.state.error" class="error">
        <p>{{ store.state.error }}</p>
      </div>
      <div v-else-if="store.sortedCharacters.length === 0" class="no-characters">
        <p>No premade characters yet. Click 'Create Character' to get started.</p>
      </div>
      <div v-else class="characters-list">
        <div v-for="character in store.sortedCharacters" :key="character.id" class="character-card">
          <div class="portrait">
            <img
              v-if="character.portrait_url"
              :src="character.portrait_url"
              :alt="`${character.name}'s portrait`"
            />
            <div v-else class="no-portrait">
              No Portrait
            </div>
          </div>
          <div class="character-info">
            <h3>{{ character.name }}</h3>
            <div v-if="character.stats_json" class="stats">
              <div v-for="(value, key) in character.stats_json" :key="key" class="stat">
                <span class="stat-label">{{ key }}:</span>
                <span class="stat-value">{{ value }}</span>
              </div>
            </div>
          </div>
          <div class="character-actions">
            <button @click="editCharacter(character)">Edit</button>
            <button @click="deleteCharacter(character.id)" class="delete">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit character dialog -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-content">
        <h3>{{ editingCharacter ? 'Edit Character' : 'Create Character' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="character-name">Character Name</label>
            <input 
              id="character-name"
              v-model="formData.name"
              type="text"
              required
              placeholder="Enter character name"
            />
          </div>

          <div class="form-group">
            <label for="character-portrait">Portrait Image</label>
            <div class="portrait-upload">
              <img
                v-if="portraitPreview"
                :src="portraitPreview"
                alt="Portrait preview"
                class="preview"
              />
              <div v-else-if="formData.portrait_url" class="preview">
                <img :src="formData.portrait_url" alt="Current portrait" />
              </div>
              <div v-else class="no-preview">
                No portrait selected
              </div>
              <input
                id="character-portrait"
                type="file"
                accept="image/*"
                @change="handlePortraitChange"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Character Stats</label>
            <div class="stats-grid">
              <div v-for="stat in ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']" :key="stat" class="stat-input">
                <label :for="'stat-' + stat">{{ stat }}</label>
                <input
                  :id="'stat-' + stat"
                  v-model.number="stats[stat]"
                  type="number"
                  min="0"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeDialog">Cancel</button>
            <button type="submit" :disabled="store.state.loading">
              {{ store.state.loading ? 'Saving...' : (editingCharacter ? 'Save Changes' : 'Create Character') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCharacterStore } from '../../stores/character'
import type { PremadeCharacter } from '../../types/character'

// Store setup
const store = useCharacterStore()

// Component state
const showCreateDialog = ref(false)
const editingCharacter = ref<PremadeCharacter | null>(null)
const formData = ref({
  name: '',
  portrait_url: null as string | null
})
const stats = ref({
  STR: 10,
  DEX: 10,
  CON: 10,
  INT: 10,
  WIS: 10,
  CHA: 10
})
const selectedPortrait = ref<File | null>(null)
const portraitPreview = ref<string | null>(null)

// Methods
function editCharacter(character: PremadeCharacter) {
  editingCharacter.value = character
  formData.value = {
    name: character.name,
    portrait_url: character.portrait_url
  }
  stats.value = character.stats_json || {
    STR: 10,
    DEX: 10,
    CON: 10,
    INT: 10,
    WIS: 10,
    CHA: 10
  }
  showCreateDialog.value = true
}

function closeDialog() {
  showCreateDialog.value = false
  editingCharacter.value = null
  formData.value = {
    name: '',
    portrait_url: null
  }
  stats.value = {
    STR: 10,
    DEX: 10,
    CON: 10,
    INT: 10,
    WIS: 10,
    CHA: 10
  }
  selectedPortrait.value = null
  portraitPreview.value = null
}

function handlePortraitChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    const file = input.files[0]
    selectedPortrait.value = file
    portraitPreview.value = URL.createObjectURL(file)
  }
}

async function handleSubmit() {
  const characterData = {
    ...formData.value,
    stats_json: stats.value
  }

  try {
    if (editingCharacter.value) {
      await store.updateCharacter(
        editingCharacter.value.id,
        characterData,
        selectedPortrait.value || undefined
      )
    } else {
      await store.createCharacter(
        characterData,
        selectedPortrait.value || undefined
      )
    }
    closeDialog()
  } catch (error) {
    // Error is handled by the store
  }
}

async function deleteCharacter(id: string) {
  if (confirm('Are you sure you want to delete this character? This cannot be undone.')) {
    try {
      await store.deleteCharacter(id)
    } catch (error) {
      // Error is handled by the store
    }
  }
}

// Lifecycle
onMounted(() => {
  store.fetchPremadeCharacters()
  const unsubscribe = store.subscribeToChanges()
  onUnmounted(() => {
    unsubscribe()
    // Clean up any object URLs
    if (portraitPreview.value) {
      URL.revokeObjectURL(portraitPreview.value)
    }
  })
})
</script>

<style scoped>
.characters-view {
  padding: 0.25rem;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.characters-header {
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

.no-characters {
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

.characters-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.character-card {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 1rem;
}

.portrait {
  width: 100px;
  height: 100px;
  border-radius: 0.25rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-portrait {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.8rem;
  opacity: 0.5;
}

.character-info {
  flex: 1;
}

.character-info h3 {
  margin: 0 0 0.5rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  font-size: 0.9rem;
}

.stat {
  display: flex;
  gap: 0.25rem;
}

.stat-label {
  opacity: 0.7;
}

.character-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.character-actions button {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
}

.character-actions button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.character-actions button.delete {
  background: rgba(255, 0, 0, 0.1);
  border-color: rgba(255, 0, 0, 0.2);
}

.character-actions button.delete:hover {
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
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  font-size: 1rem;
}

.portrait-upload {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.preview {
  width: 200px;
  height: 200px;
  border-radius: 0.5rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-preview {
  width: 200px;
  height: 200px;
  border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.5;
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
  opacity: 0.7;
}

.stat-input input {
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  font-size: 1rem;
  text-align: center;
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

.form-actions button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.form-actions button[type="submit"]:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.7);
}

.form-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>