<template>
  <div class="monsters-view min-h-screen">
    <header class="encounter-header bg-stone-900 text-stone-100 border-b p-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white">Monster Library</h1>
          <p class="text-stone-400 mt-1">Manage your collection of monsters for encounters</p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search bar -->
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search monsters..."
              class="w-64 pl-10 pr-4 py-2 bg-stone-700 border border-stone-600 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            />
            <svg class="absolute left-3 top-2.5 h-5 w-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Challenge Rating filter -->
          <select
            v-model="selectedCR"
            class="px-4 py-2 bg-stone-700 border border-stone-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Challenge Ratings</option>
            <option value="0">CR 0</option>
            <option value="1/8">CR 1/8</option>
            <option value="1/4">CR 1/4</option>
            <option value="1/2">CR 1/2</option>
            <option value="1">CR 1</option>
            <option value="2">CR 2</option>
            <option value="3">CR 3</option>
            <option value="4">CR 4</option>
            <option value="5">CR 5</option>
            <option value="10">CR 10</option>
            <option value="15">CR 15</option>
            <option value="20">CR 20+</option>
          </select>

          <!-- Add Monster button -->
          <button
            @click="showCreateModal = true"
            class="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Monster
          </button>
        </div>
      </div>
    </header>

    <div class="p-6">
      <!-- Stats summary -->
      <div v-if="!combatStore.isLoading && !combatStore.error" class="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-stone-800 rounded-lg p-4 border border-stone-700">
          <div class="text-2xl font-bold text-white">{{ filteredMonsters.length }}</div>
          <div class="text-stone-400 text-sm">Total Monsters</div>
        </div>
        <div class="bg-stone-800 rounded-lg p-4 border border-stone-700">
          <div class="text-2xl font-bold text-green-400">{{ lowCRCount }}</div>
          <div class="text-stone-400 text-sm">Low CR (0-1)</div>
        </div>
        <div class="bg-stone-800 rounded-lg p-4 border border-stone-700">
          <div class="text-2xl font-bold text-yellow-400">{{ medCRCount }}</div>
          <div class="text-stone-400 text-sm">Medium CR (2-10)</div>
        </div>
        <div class="bg-stone-800 rounded-lg p-4 border border-stone-700">
          <div class="text-2xl font-bold text-red-400">{{ highCRCount }}</div>
          <div class="text-stone-400 text-sm">High CR (10+)</div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="combatStore.isLoading" class="text-center text-stone-300 py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-lg">Loading your monster collection...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="combatStore.error" class="bg-red-900 border border-red-700 rounded-lg p-6 text-center">
        <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="text-lg font-semibold text-red-400 mb-2">Error Loading Monsters</h3>
        <p class="text-red-300 mb-4">{{ combatStore.error }}</p>
        <button
          @click="combatStore.fetchMonsters()"
          class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Monsters grid with improved layout -->
      <div v-else-if="filteredMonsters.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="monster in filteredMonsters"
          :key="monster.id"
          class="bg-stone-800 rounded-xl border border-stone-700 hover:border-blue-500 hover:shadow-xl transition-all duration-200 overflow-hidden group relative"
        >
          <!-- Monster header with better typography -->
          <div class="p-6 pb-4">
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1 min-w-0">
                <h3 class="text-xl font-bold text-white truncate">{{ monster.name }}</h3>
                <div class="flex items-center gap-3 mt-2">
                  <span v-if="monster.challenge_rating" 
                    :class="getCRBadgeClass(monster.challenge_rating)"
                    class="px-2 py-1 rounded-full text-xs font-semibold"
                  >
                    CR {{ monster.challenge_rating }}
                  </span>
                </div>
              </div>
              
              <!-- Improved Action dropdown -->
              <div class="relative">
                <button
                  @click="toggleMonsterMenu(monster.id)"
                  class="px-4 py-2 bg-blue-700 text-white font-semibold rounded-lg border border-blue-500 shadow hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-colors flex items-center gap-2"
                  title="Monster Actions"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
                  </svg>
                  Actions
                </button>
                <div v-if="openMenuId === monster.id" 
                  class="absolute right-0 mt-2 w-48 bg-stone-700 rounded-lg shadow-xl border border-blue-500 z-50"
                >
                  <button
                    @click="editMonster(monster); closeMenu()"
                    class="w-full flex items-center gap-3 px-4 py-3 text-left text-stone-300 hover:text-white hover:bg-stone-600 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Monster
                  </button>
                  <button
                    @click="duplicateMonster(monster); closeMenu()"
                    class="w-full flex items-center gap-3 px-4 py-3 text-left text-stone-300 hover:text-white hover:bg-stone-600 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Duplicate
                  </button>
                  <hr class="border-stone-600 my-1">
                  <button
                    @click="deleteMonster(monster.id); closeMenu()"
                    class="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:text-red-300 hover:bg-stone-600 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <!-- Monster stats with better visual hierarchy -->
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div class="text-center p-3 bg-stone-700 rounded-lg">
                <div class="text-2xl font-bold text-red-400">{{ monster.hit_points }}</div>
                <div class="text-xs text-stone-400 uppercase tracking-wide">Hit Points</div>
              </div>
              <div class="text-center p-3 bg-stone-700 rounded-lg">
                <div class="text-2xl font-bold text-blue-400">{{ monster.armor_class }}</div>
                <div class="text-xs text-stone-400 uppercase tracking-wide">Armor Class</div>
              </div>
              <div class="text-center p-3 bg-stone-700 rounded-lg">
                <div class="text-2xl font-bold text-yellow-400">{{ monster.challenge_rating || 'N/A' }}</div>
                <div class="text-xs text-stone-400 uppercase tracking-wide">Challenge</div>
              </div>
            </div>

            <!-- Monster description with proper truncation -->
            <div v-if="monster.description" class="text-sm text-stone-300 leading-relaxed h-30">
              <p class="line-clamp-3">{{ monster.description }}</p>
            </div>
            <div v-else class="text-sm text-stone-500 italic">
              No description provided
            </div>
          </div>

          <!-- Action bar -->
          <div class="px-6 py-4 bg-stone-750 border-t border-stone-700 flex justify-between items-center absolute bottom-0 w-full">
            <span class="text-xs text-stone-500">
              Created {{ formatDate(monster.created_at) }}
            </span>
            <button
              @click="editMonster(monster)"
              class="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>
      </div>

      <!-- Improved empty state -->
      <div v-else-if="searchQuery || selectedCR" class="text-center py-16">
        <svg class="w-16 h-16 text-stone-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-stone-400 mb-2">No monsters found</h3>
        <p class="text-stone-500 mb-4">Try adjusting your search or filters</p>
        <button
          @click="clearFilters"
          class="bg-stone-700 hover:bg-stone-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <!-- Empty state for no monsters at all -->
      <div v-else class="text-center py-16">
        <div class="bg-stone-800 rounded-xl p-12 max-w-md mx-auto border border-stone-700">
          <svg class="w-20 h-20 text-stone-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          <h3 class="text-xl font-semibold text-stone-400 mb-3">Your monster library is empty</h3>
          <p class="text-stone-500 mb-6">Get started by creating your first monster template</p>
          <button
            @click="showCreateModal = true"
            class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium inline-flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Monster
          </button>
        </div>
      </div>
    </div>

    <!-- Improved Create/Edit Monster Modal -->
    <div v-if="showCreateModal || editingMonster" 
         class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div class="bg-stone-800 rounded-xl w-full max-w-lg border border-stone-700 shadow-2xl">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b border-stone-700">
          <h2 class="text-2xl font-bold text-white">
            {{ editingMonster ? 'Edit Monster' : 'Create New Monster' }}
          </h2>
          <button
            @click="closeModal"
            class="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-700 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <form @submit.prevent="saveMonster" class="p-6 space-y-6">
          <!-- Name Field -->
          <div>
            <label class="block text-sm font-semibold text-stone-300 mb-2">
              Monster Name *
            </label>
            <input
              v-model="monsterForm.name"
              type="text"
              required
              class="w-full p-3 bg-stone-700 border border-stone-600 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
              placeholder="e.g., Goblin Warrior"
            />
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-stone-300 mb-2">
                Hit Points *
              </label>
              <input
                v-model.number="monsterForm.hit_points"
                type="number"
                required
                min="1"
                max="999"
                class="w-full p-3 bg-stone-700 border border-stone-600 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
                placeholder="25"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-stone-300 mb-2">
                Armor Class *
              </label>
              <input
                v-model.number="monsterForm.armor_class"
                type="number"
                required
                min="1"
                max="30"
                class="w-full p-3 bg-stone-700 border border-stone-600 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
                placeholder="15"
              />
            </div>
          </div>

          <!-- Challenge Rating with suggestions -->
          <div>
            <label class="block text-sm font-semibold text-stone-300 mb-2">
              Challenge Rating
            </label>
            <select
              v-model="monsterForm.challenge_rating"
              class="w-full p-3 bg-stone-700 border border-stone-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
            >
              <option value="">Select Challenge Rating</option>
              <option value="0">CR 0 - Harmless creatures</option>
              <option value="1/8">CR 1/8 - Very weak enemies</option>
              <option value="1/4">CR 1/4 - Weak enemies</option>
              <option value="1/2">CR 1/2 - Minor threats</option>
              <option value="1">CR 1 - Basic adversaries</option>
              <option value="2">CR 2 - Moderate threats</option>
              <option value="3">CR 3 - Challenging foes</option>
              <option value="4">CR 4 - Dangerous enemies</option>
              <option value="5">CR 5 - Serious threats</option>
              <option value="10">CR 10 - Elite adversaries</option>
              <option value="15">CR 15 - Legendary foes</option>
              <option value="20">CR 20+ - Epic bosses</option>
            </select>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-semibold text-stone-300 mb-2">
              Description
            </label>
            <textarea
              v-model="monsterForm.description"
              rows="4"
              class="w-full p-3 bg-stone-700 border border-stone-600 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all resize-none"
              placeholder="Describe the monster's appearance, behavior, and special abilities..."
            ></textarea>
          </div>

          <!-- Form Actions -->
          <div class="flex gap-4 pt-4 border-t border-stone-700">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 bg-stone-600 hover:bg-stone-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-2 bg-green-600 hover:bg-green-700 disabled:bg-stone-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg transition-colors font-medium inline-flex items-center justify-center gap-2"
            >
              <svg v-if="isSubmitting" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ isSubmitting ? 'Saving...' : (editingMonster ? 'Update Monster' : 'Create Monster') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue'
import { useCombatStore } from '../../stores/combat'
import type { MonsterTemplate } from '../../types/combat'

const combatStore = useCombatStore()

// Modal state
const showCreateModal = ref(false)
const editingMonster = ref<MonsterTemplate | null>(null)
const isSubmitting = ref(false)

// Search and filter state
const searchQuery = ref('')
const selectedCR = ref('')
const openMenuId = ref<string | null>(null)

// Form data
const monsterForm = reactive({
  name: '',
  hit_points: 1,
  armor_class: 10,
  challenge_rating: '',
  description: ''
})

// Computed properties
const filteredMonsters = computed(() => {
  let filtered = combatStore.monsters

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(monster => 
      monster.name.toLowerCase().includes(query) ||
      monster.description?.toLowerCase().includes(query) ||
      monster.challenge_rating?.toLowerCase().includes(query)
    )
  }

  // Apply CR filter
  if (selectedCR.value) {
    filtered = filtered.filter(monster => monster.challenge_rating === selectedCR.value)
  }

  return filtered
})

// CR statistics
const lowCRCount = computed(() => {
  return combatStore.monsters.filter(monster => {
    const cr = monster.challenge_rating
    if (!cr) return false
    const numCR = parseFloat(cr.replace('1/', '0.'))
    return numCR >= 0 && numCR <= 1
  }).length
})

const medCRCount = computed(() => {
  return combatStore.monsters.filter(monster => {
    const cr = monster.challenge_rating
    if (!cr) return false
    const numCR = parseFloat(cr.replace('1/', '0.'))
    return numCR > 1 && numCR <= 10
  }).length
})

const highCRCount = computed(() => {
  return combatStore.monsters.filter(monster => {
    const cr = monster.challenge_rating
    if (!cr) return false
    const numCR = parseFloat(cr.replace('1/', '0.'))
    return numCR > 10
  }).length
})

// Utility functions
const getCRBadgeClass = (cr: string | null) => {
  if (!cr) return 'bg-stone-600 text-stone-300'
  
  const numCR = parseFloat(cr.replace('1/', '0.'))
  if (numCR >= 0 && numCR <= 1) return 'bg-green-600 text-green-100'
  if (numCR > 1 && numCR <= 5) return 'bg-yellow-600 text-yellow-100'
  if (numCR > 5 && numCR <= 10) return 'bg-orange-600 text-orange-100'
  return 'bg-red-600 text-red-100'
}

const formatDate = (date: string | null) => {
  if (!date) return 'Unknown'
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return 'Unknown'
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCR.value = ''
}

// Menu functions
const toggleMonsterMenu = (monsterId: string) => {
  openMenuId.value = openMenuId.value === monsterId ? null : monsterId
}

const closeMenu = () => {
  openMenuId.value = null
}

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (!event.target || !(event.target as Element).closest('.relative')) {
    closeMenu()
  }
}

// Form functions
const resetForm = () => {
  monsterForm.name = ''
  monsterForm.hit_points = 1
  monsterForm.armor_class = 10
  monsterForm.challenge_rating = ''
  monsterForm.description = ''
}

const closeModal = () => {
  showCreateModal.value = false
  editingMonster.value = null
  resetForm()
}

const editMonster = (monster: MonsterTemplate) => {
  editingMonster.value = monster
  monsterForm.name = monster.name
  monsterForm.hit_points = monster.hit_points
  monsterForm.armor_class = monster.armor_class
  monsterForm.challenge_rating = monster.challenge_rating || ''
  monsterForm.description = monster.description || ''
  closeMenu()
}

const duplicateMonster = async (monster: MonsterTemplate) => {
  try {
    const duplicateData = {
      name: `${monster.name} (Copy)`,
      hit_points: monster.hit_points,
      armor_class: monster.armor_class,
      challenge_rating: monster.challenge_rating,
      description: monster.description
    }
    
    await combatStore.createMonster(duplicateData)
  } catch (error) {
    console.error('Failed to duplicate monster:', error)
  }
}

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
      await combatStore.updateMonster(editingMonster.value.id, monsterData)
    } else {
      await combatStore.createMonster(monsterData)
    }
    
    closeModal()
  } catch (error) {
    console.error('Failed to save monster:', error)
  } finally {
    isSubmitting.value = false
  }
}

const deleteMonster = async (id: string) => {
  if (!confirm('Are you sure you want to delete this monster? This action cannot be undone.')) return
  
  try {
    await combatStore.deleteMonster(id)
  } catch (error) {
    console.error('Failed to delete monster:', error)
  }
}

// Lifecycle
onMounted(() => {
  combatStore.fetchMonsters()
  document.addEventListener('click', handleClickOutside)
})

// Watchers
watch([searchQuery, selectedCR], () => {
  // Close any open menus when filters change
  closeMenu()
})
</script>

<style scoped>
.line-clamp-3 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.monster-library-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem !important;
  background-color: #18181b !important;
}
</style>