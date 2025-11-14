<template>
  <div class="encounters-view">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-white">Combat Encounters</h1>
      <button
        @click="showCreateModal = true"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Create Encounter
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="combatStore.isLoading" class="text-center text-gray-300 py-8">
      Loading encounters...
    </div>

    <!-- Error state -->
    <div v-else-if="combatStore.error" class="text-red-400 text-center py-8">
      Error: {{ combatStore.error }}
    </div>

    <!-- Encounters list -->
    <div v-else class="space-y-4">
      <div
        v-for="encounter in combatStore.encounters"
        :key="encounter.id"
        class="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors"
      >
        <!-- Encounter header -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-xl font-semibold text-white">{{ encounter.name }}</h3>
            <p v-if="encounter.description" class="text-gray-300 mt-1">{{ encounter.description }}</p>
          </div>
          <div class="flex gap-2">
            <button
              @click="addMonsterToEncounter(encounter)"
              class="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded transition-colors"
            >
              Add Monster
            </button>
            <button
              @click="editEncounter(encounter)"
              class="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Edit
            </button>
            <button
              @click="deleteEncounter(encounter.id)"
              class="text-red-400 hover:text-red-300 text-sm transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Monsters in encounter -->
        <div v-if="encounter.monsters && encounter.monsters.length > 0">
          <h4 class="text-sm font-semibold text-gray-300 mb-2">Monsters:</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <div
              v-for="encounterMonster in encounter.monsters"
              :key="encounterMonster.id"
              class="bg-gray-700 rounded p-3 flex justify-between items-center"
            >
              <div>
                <span class="text-white font-medium">
                  {{ encounterMonster.monster_template?.name || 'Unknown Monster' }}
                </span>
                <span class="text-gray-300 ml-2">×{{ encounterMonster.quantity }}</span>
                <div v-if="encounterMonster.monster_template" class="text-xs text-gray-400 mt-1">
                  HP: {{ encounterMonster.monster_template.hit_points }}, 
                  AC: {{ encounterMonster.monster_template.armor_class }}
                </div>
              </div>
              <button
                @click="removeMonsterFromEncounter(encounterMonster.id)"
                class="text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-400 text-sm">
          No monsters added yet. Click "Add Monster" to get started.
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!combatStore.isLoading && !combatStore.error && combatStore.encounters.length === 0" 
         class="text-center text-gray-400 py-12">
      <p>No encounters found.</p>
      <p class="mt-2">Click "Create Encounter" to build your first combat encounter.</p>
    </div>

    <!-- Create/Edit Encounter Modal -->
    <div v-if="showCreateModal || editingEncounter" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 rounded-lg w-full max-w-md">
        <div class="p-6">
          <h2 class="text-xl font-bold text-white mb-4">
            {{ editingEncounter ? 'Edit Encounter' : 'Create Encounter' }}
          </h2>

          <form @submit.prevent="saveEncounter" class="space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-sm text-gray-300 mb-1">Name *</label>
              <input
                v-model="encounterForm.name"
                type="text"
                required
                class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Goblin Ambush"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm text-gray-300 mb-1">Description</label>
              <textarea
                v-model="encounterForm.description"
                rows="3"
                class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 resize-none"
                placeholder="A group of goblins attack the party on the forest road"
              ></textarea>
            </div>

            <!-- Form actions -->
            <div class="flex gap-3 mt-6">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                {{ isSubmitting ? 'Saving...' : (editingEncounter ? 'Update' : 'Create') }}
              </button>
              <button
                type="button"
                @click="closeEncounterModal"
                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Add Monster to Encounter Modal -->
    <div v-if="showMonsterModal" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 rounded-lg w-full max-w-2xl">
        <div class="p-6">
          <h2 class="text-xl font-bold text-white mb-4">
            Add Monster to {{ selectedEncounter?.name }}
          </h2>

          <div v-if="combatStore.monsters.length === 0" class="text-gray-400 text-center py-8">
            <p>No monsters available.</p>
            <p class="mt-2">Create some monsters first in the Monster Library.</p>
          </div>
          
          <div v-else class="space-y-4">
            <!-- Monster selection -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              <div
                v-for="monster in combatStore.monsters"
                :key="monster.id"
                @click="selectMonster(monster)"
                :class="[
                  'bg-gray-700 rounded p-3 cursor-pointer border-2 transition-colors',
                  selectedMonster?.id === monster.id ? 'border-blue-500' : 'border-transparent hover:border-gray-500'
                ]"
              >
                <h4 class="font-semibold text-white">{{ monster.name }}</h4>
                <div class="text-sm text-gray-300 mt-1">
                  HP: {{ monster.hit_points }}, AC: {{ monster.armor_class }}
                  <span v-if="monster.challenge_rating" class="ml-2">CR: {{ monster.challenge_rating }}</span>
                </div>
              </div>
            </div>

            <!-- Quantity selection -->
            <div v-if="selectedMonster" class="border-t border-gray-600 pt-4">
              <label class="block text-sm text-gray-300 mb-2">Quantity</label>
              <input
                v-model.number="monsterQuantity"
                type="number"
                min="1"
                max="20"
                class="w-20 p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <!-- Modal actions -->
          <div class="flex gap-3 mt-6">
            <button
              v-if="selectedMonster"
              @click="addSelectedMonster"
              :disabled="isSubmitting"
              class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {{ isSubmitting ? 'Adding...' : 'Add Monster' }}
            </button>
            <button
              @click="closeMonsterModal"
              class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useCombatStore } from '../../stores/combat'
import type { CombatEncounter, CombatEncounterWithMonsters, MonsterTemplate } from '../../types/combat'

const combatStore = useCombatStore()

// Modal state
const showCreateModal = ref(false)
const showMonsterModal = ref(false)
const editingEncounter = ref<CombatEncounterWithMonsters | null>(null)
const selectedEncounter = ref<CombatEncounterWithMonsters | null>(null)
const selectedMonster = ref<MonsterTemplate | null>(null)
const monsterQuantity = ref(1)
const isSubmitting = ref(false)

// Form data
const encounterForm = reactive({
  name: '',
  description: ''
})

// Reset encounter form
const resetEncounterForm = () => {
  encounterForm.name = ''
  encounterForm.description = ''
}

// Close encounter modal
const closeEncounterModal = () => {
  showCreateModal.value = false
  editingEncounter.value = null
  resetEncounterForm()
}

// Close monster modal
const closeMonsterModal = () => {
  showMonsterModal.value = false
  selectedEncounter.value = null
  selectedMonster.value = null
  monsterQuantity.value = 1
}

// Edit encounter
const editEncounter = (encounter: CombatEncounterWithMonsters) => {
  editingEncounter.value = encounter
  encounterForm.name = encounter.name
  encounterForm.description = encounter.description || ''
}

// Save encounter (create or update)
const saveEncounter = async () => {
  if (isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    
    const encounterData = {
      name: encounterForm.name,
      description: encounterForm.description || null
    }
    
    if (editingEncounter.value) {
      // Update existing encounter
      // TODO: Implement updateEncounter in store
      console.log('Update encounter not implemented yet')
    } else {
      // Create new encounter
      await combatStore.createEncounter(encounterData)
    }
    
    closeEncounterModal()
  } catch (error) {
    console.error('Failed to save encounter:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Delete encounter with confirmation
const deleteEncounter = async (id: string) => {
  if (!confirm('Are you sure you want to delete this encounter?')) return
  
  try {
    // TODO: Implement deleteEncounter in store
    console.log('Delete encounter not implemented yet')
  } catch (error) {
    console.error('Failed to delete encounter:', error)
  }
}

// Add monster to encounter
const addMonsterToEncounter = (encounter: CombatEncounterWithMonsters) => {
  selectedEncounter.value = encounter
  showMonsterModal.value = true
}

// Select monster from list
const selectMonster = (monster: MonsterTemplate) => {
  selectedMonster.value = monster
}

// Add selected monster to encounter
const addSelectedMonster = async () => {
  if (!selectedEncounter.value || !selectedMonster.value) return
  
  try {
    isSubmitting.value = true
    await combatStore.addMonsterToEncounter(
      selectedEncounter.value.id,
      selectedMonster.value.id,
      monsterQuantity.value
    )
    closeMonsterModal()
  } catch (error) {
    console.error('Failed to add monster to encounter:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Remove monster from encounter
const removeMonsterFromEncounter = async (encounterMonsterId: string) => {
  if (!confirm('Remove this monster from the encounter?')) return
  
  try {
    // TODO: Implement removeMonsterFromEncounter in store
    console.log('Remove monster from encounter not implemented yet')
  } catch (error) {
    console.error('Failed to remove monster from encounter:', error)
  }
}

// Load data on mount
onMounted(async () => {
  await Promise.all([
    combatStore.fetchEncounters(),
    combatStore.fetchMonsters()
  ])
})
</script>