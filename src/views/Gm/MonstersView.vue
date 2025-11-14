<template>
  <div class="monsters-view">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-white">Monster Library</h1>
      <button
        @click="showCreateModal = true"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Add Monster
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="combatStore.isLoading" class="text-center text-gray-300 py-8">
      Loading monsters...
    </div>

    <!-- Error state -->
    <div v-else-if="combatStore.error" class="text-red-400 text-center py-8">
      Error: {{ combatStore.error }}
    </div>

    <!-- Monsters grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="monster in combatStore.monsters"
        :key="monster.id"
        class="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors"
      >
        <!-- Monster header -->
        <div class="flex justify-between items-start mb-3">
          <h3 class="text-lg font-semibold text-white">{{ monster.name }}</h3>
          <div class="flex gap-2">
            <button
              @click="editMonster(monster)"
              class="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Edit
            </button>
            <button
              @click="deleteMonster(monster.id)"
              class="text-red-400 hover:text-red-300 text-sm transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Monster stats -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-gray-400">HP:</span>
            <span class="text-white ml-1">{{ monster.hit_points }}</span>
          </div>
          <div>
            <span class="text-gray-400">AC:</span>
            <span class="text-white ml-1">{{ monster.armor_class }}</span>
          </div>
          <div class="col-span-2" v-if="monster.challenge_rating">
            <span class="text-gray-400">CR:</span>
            <span class="text-white ml-1">{{ monster.challenge_rating }}</span>
          </div>
        </div>

        <!-- Monster description -->
        <div v-if="monster.description" class="mt-3 text-sm text-gray-300">
          {{ monster.description }}
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!combatStore.isLoading && !combatStore.error && combatStore.monsters.length === 0" 
         class="text-center text-gray-400 py-12">
      <p>No monsters found.</p>
      <p class="mt-2">Click "Add Monster" to create your first monster.</p>
    </div>

    <!-- Create/Edit Monster Modal -->
    <div v-if="showCreateModal || editingMonster" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 rounded-lg w-full max-w-md">
        <div class="p-6">
          <h2 class="text-xl font-bold text-white mb-4">
            {{ editingMonster ? 'Edit Monster' : 'Create Monster' }}
          </h2>

          <form @submit.prevent="saveMonster" class="space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-sm text-gray-300 mb-1">Name *</label>
              <input
                v-model="monsterForm.name"
                type="text"
                required
                class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Goblin"
              />
            </div>

            <!-- Hit Points -->
            <div>
              <label class="block text-sm text-gray-300 mb-1">Hit Points *</label>
              <input
                v-model.number="monsterForm.hit_points"
                type="number"
                required
                min="1"
                class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="7"
              />
            </div>

            <!-- Armor Class -->
            <div>
              <label class="block text-sm text-gray-300 mb-1">Armor Class *</label>
              <input
                v-model.number="monsterForm.armor_class"
                type="number"
                required
                min="1"
                class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="15"
              />
            </div>

            <!-- Challenge Rating -->
            <div>
              <label class="block text-sm text-gray-300 mb-1">Challenge Rating</label>
              <input
                v-model="monsterForm.challenge_rating"
                type="text"
                class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="1/4"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm text-gray-300 mb-1">Description</label>
              <textarea
                v-model="monsterForm.description"
                rows="3"
                class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Small humanoid, neutral evil"
              ></textarea>
            </div>

            <!-- Form actions -->
            <div class="flex gap-3 mt-6">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                {{ isSubmitting ? 'Saving...' : (editingMonster ? 'Update' : 'Create') }}
              </button>
              <button
                type="button"
                @click="closeModal"
                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useCombatStore } from '../../stores/combat'
import type { MonsterTemplate } from '../../types/combat'

const combatStore = useCombatStore()

// Modal state
const showCreateModal = ref(false)
const editingMonster = ref<MonsterTemplate | null>(null)
const isSubmitting = ref(false)

// Form data
const monsterForm = reactive({
  name: '',
  hit_points: 1,
  armor_class: 10,
  challenge_rating: '',
  description: ''
})

// Reset form
const resetForm = () => {
  monsterForm.name = ''
  monsterForm.hit_points = 1
  monsterForm.armor_class = 10
  monsterForm.challenge_rating = ''
  monsterForm.description = ''
}

// Close modal
const closeModal = () => {
  showCreateModal.value = false
  editingMonster.value = null
  resetForm()
}

// Edit monster
const editMonster = (monster: MonsterTemplate) => {
  editingMonster.value = monster
  monsterForm.name = monster.name
  monsterForm.hit_points = monster.hit_points
  monsterForm.armor_class = monster.armor_class
  monsterForm.challenge_rating = monster.challenge_rating || ''
  monsterForm.description = monster.description || ''
}

// Save monster (create or update)
const saveMonster = async () => {
  if (isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    
    const monsterData = {
      name: monsterForm.name,
      hit_points: monsterForm.hit_points,
      armor_class: monsterForm.armor_class,
      challenge_rating: monsterForm.challenge_rating || null,
      description: monsterForm.description || null
    }
    
    if (editingMonster.value) {
      // Update existing monster
      await combatStore.updateMonster(editingMonster.value.id, monsterData)
    } else {
      // Create new monster
      await combatStore.createMonster(monsterData)
    }
    
    closeModal()
  } catch (error) {
    console.error('Failed to save monster:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Delete monster with confirmation
const deleteMonster = async (id: string) => {
  if (!confirm('Are you sure you want to delete this monster?')) return
  
  try {
    await combatStore.deleteMonster(id)
  } catch (error) {
    console.error('Failed to delete monster:', error)
  }
}

// Load monsters on mount
onMounted(() => {
  combatStore.fetchMonsters()
})
</script>