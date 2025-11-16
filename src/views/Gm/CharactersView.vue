<template>
  <div class="min-h-screen bg-stone-900 text-stone-100 overflow-y-auto">
    <header class="flex justify-between items-center bg-stone-900 text-stone-100 border-b p-6 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-white">Premade Characters</h1>
        <p class="text-stone-400 mt-1">Manage your premade characters for sessions</p>
      </div>
      <button
        class="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg"
        @click="showCreateDialog = true">
        Create Character
      </button>
    </header>

    <div>
      <div v-if="store.state.loading" class="loading">
        <p>Loading characters...</p>
      </div>
      <div v-else-if="store.state.error" class="error">
        <p>{{ store.state.error }}</p>
      </div>
      <div v-else-if="store.sortedCharacters.length === 0" class="no-characters">
        <p>No premade characters yet. Click 'Create Character' to get started.</p>
      </div>
      <div v-else
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-8 max-h-[70vh] overflow-y-auto w-full">
        <div v-for="character in store.sortedCharacters" :key="character.id"
          class="flex flex-col bg-stone-800 border border-stone-700 rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 w-full min-h-80">
          <div class="flex items-center justify-center mb-4">
            <div class="w-32 h-32 rounded-xl bg-black/20 overflow-hidden flex items-center justify-center">
              <img v-if="character.portrait_url" :src="character.portrait_url" :alt="`${character.name}'s portrait`"
                class="w-full h-full object-cover" />
              <div v-else class="text-base text-center opacity-50">No Portrait</div>
            </div>
          </div>
          <div class="flex-1 flex flex-col items-center justify-center w-full">
            <h3 class="font-bold text-lg text-stone-100 mb-2 text-center w-full break-word">{{ character.name }}</h3>
            <div v-if="character.stats_json" class="grid grid-cols-3 gap-2 text-sm w-full mb-2">
              <div v-for="(value, key) in character.stats_json" :key="key" class="flex gap-1 justify-center">
                <span class="opacity-70">{{ key }}:</span>
                <span>{{ value }}</span>
              </div>
            </div>
          </div>
          <div class="flex gap-4 mt-4 justify-center w-full">
            <button
              class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition w-1/2"
              @click="editCharacter(character)">Edit</button>
            <button
              class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition w-1/2"
              @click="deleteCharacter(character.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit character dialog -->
    <div v-if="showCreateDialog" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div class="bg-stone-800 rounded-xl w-full max-w-md border border-stone-700 shadow-2xl p-8">
        <h3 class="text-2xl font-bold text-white mb-6">{{ editingCharacter ? 'Edit Character' : 'Create Character' }}
        </h3>
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="character-name" class="block text-sm font-semibold text-stone-300 mb-2">Character Name</label>
            <input id="character-name" v-model="formData.name" type="text" required
              class="w-full p-3 bg-stone-700 border border-stone-600 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
              placeholder="Enter character name" />
          </div>
          <div>
            <label for="character-portrait" class="block text-sm font-semibold text-stone-300 mb-2">Portrait
              Image</label>
            <div class="flex flex-col gap-4 items-center">
              <img v-if="portraitPreview" :src="portraitPreview" alt="Portrait preview"
                class="w-32 h-32 rounded-lg object-cover bg-stone-900" />
              <img v-else-if="formData.portrait_url" :src="formData.portrait_url" alt="Current portrait"
                class="w-32 h-32 rounded-lg object-cover bg-stone-900" />
              <div v-else
                class="w-32 h-32 rounded-lg bg-stone-900 flex items-center justify-center text-stone-500 text-sm">No
                portrait selected</div>
              <input id="character-portrait" type="file" accept="image/*" @change="handlePortraitChange" class="mt-2" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-stone-300 mb-2">Character Stats</label>
            <div class="grid grid-cols-3 gap-4">
              <div v-for="stat in ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']" :key="stat" class="flex flex-col gap-1">
                <label :for="'stat-' + stat" class="text-xs text-stone-400">{{ stat }}</label>
                <input :id="'stat-' + stat" v-model.number="stats[stat as keyof typeof stats]" type="number" min="0"
                  class="w-full p-2 bg-stone-700 border border-stone-600 rounded text-white text-center"
                  placeholder="10" />
              </div>
            </div>
          </div>
          <div class="flex gap-4 pt-4 border-t border-stone-700 mt-6">
            <button type="button" @click="closeDialog"
              class="flex-1 bg-stone-600 hover:bg-stone-700 text-white py-3 px-4 rounded-lg transition-colors font-medium">Cancel</button>
            <button type="submit" :disabled="store.state.loading"
              class="flex-2 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg transition-colors font-medium">{{
                store.state.loading ? 'Saving...' : (editingCharacter ? 'Save Changes' : 'Create Character') }}</button>
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
  if (typeof character.stats_json === 'object' && character.stats_json !== null && 'STR' in character.stats_json) {
    stats.value = {
      STR: Number(character.stats_json.STR) ?? 10,
      DEX: Number(character.stats_json.DEX) ?? 10,
      CON: Number(character.stats_json.CON) ?? 10,
      INT: Number(character.stats_json.INT) ?? 10,
      WIS: Number(character.stats_json.WIS) ?? 10,
      CHA: Number(character.stats_json.CHA) ?? 10
    }
  } else {
    stats.value = {
      STR: 10,
      DEX: 10,
      CON: 10,
      INT: 10,
      WIS: 10,
      CHA: 10
    }
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
    if (file) {
      selectedPortrait.value = file
      portraitPreview.value = URL.createObjectURL(file)
    }
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
