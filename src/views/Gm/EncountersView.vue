<template>
  <div class="encounters-view min-h-screen bg-gray-900">
    <!-- Enhanced Header -->
    <div class="bg-gray-800 border-b border-gray-700 p-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white">Combat Encounters</h1>
          <p class="text-gray-400 mt-1">Build and manage encounters for your sessions</p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search encounters -->
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search encounters..."
              class="w-64 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            />
            <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Difficulty filter -->
          <select
            v-model="difficultyFilter"
            class="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy (CR 0-2)</option>
            <option value="medium">Medium (CR 3-8)</option>
            <option value="hard">Hard (CR 9-15)</option>
            <option value="deadly">Deadly (CR 16+)</option>
          </select>

          <!-- Create Encounter button -->
          <button
            @click="showCreateModal = true"
            class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Encounter
          </button>
        </div>
      </div>
    </div>

    <div class="p-6">
      <!-- Encounter Statistics -->
      <div v-if="!combatStore.isLoading && !combatStore.error" class="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div class="text-2xl font-bold text-white">{{ filteredEncounters.length }}</div>
          <div class="text-gray-400 text-sm">Total Encounters</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div class="text-2xl font-bold text-green-400">{{ easyEncounters }}</div>
          <div class="text-gray-400 text-sm">Easy Encounters</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div class="text-2xl font-bold text-yellow-400">{{ mediumEncounters }}</div>
          <div class="text-gray-400 text-sm">Medium/Hard</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div class="text-2xl font-bold text-red-400">{{ deadlyEncounters }}</div>
          <div class="text-gray-400 text-sm">Deadly/Epic</div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="combatStore.isLoading" class="text-center text-gray-300 py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-lg">Loading your encounters...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="combatStore.error" class="bg-red-900 border border-red-700 rounded-lg p-6 text-center">
        <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="text-lg font-semibold text-red-400 mb-2">Error Loading Encounters</h3>
        <p class="text-red-300 mb-4">{{ combatStore.error }}</p>
        <button
          @click="combatStore.fetchEncounters()"
          class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Enhanced Encounters List -->
      <div v-else-if="filteredEncounters.length > 0" class="space-y-6">
        <div
          v-for="encounter in filteredEncounters"
          :key="encounter.id"
          class="bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 hover:shadow-xl transition-all duration-200 overflow-hidden"
        >
          <!-- Encounter Header -->
          <div class="p-6 pb-4">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-2xl font-bold text-white truncate">{{ encounter.name }}</h3>
                  <span 
                    :class="getDifficultyBadgeClass(encounter)"
                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                  >
                    {{ getEncounterDifficulty(encounter) }}
                  </span>
                </div>
                
                <p v-if="encounter.description" class="text-gray-300 leading-relaxed line-clamp-2">
                  {{ encounter.description }}
                </p>
                <p v-else class="text-gray-500 italic">No description provided</p>

                <!-- Encounter Stats -->
                <div class="mt-4 flex flex-wrap gap-4 text-sm">
                  <div class="flex items-center gap-1">
                    <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 5.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                    <span class="text-gray-400">{{ getTotalMonsters(encounter) }} monsters</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span class="text-gray-400">Avg CR: {{ getAverageCR(encounter) }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-gray-400">Created {{ formatDate(encounter.created_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- Action Menu -->
              <div class="flex flex-row lg:flex-col gap-2">
                <button
                  @click="startCombatFromEncounter(encounter)"
                  class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Start Combat
                </button>
                
                <div class="relative">
                  <button
                    @click="toggleEncounterMenu(encounter.id)"
                    class="px-4 py-2 bg-blue-700 text-white font-semibold rounded-lg border border-blue-500 shadow hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-colors flex items-center gap-2"
                    title="Encounter Actions"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
                    </svg>
                    Actions
                  </button>

                  <div v-if="openMenuId === encounter.id" 
                    class="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl border border-blue-500 z-10"
                  >
                    <button
                      @click="addMonsterToEncounter(encounter); closeMenu()"
                      class="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Monster
                    </button>
                    <button
                      @click="editEncounter(encounter); closeMenu()"
                      class="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Encounter
                    </button>
                    <button
                      @click="duplicateEncounter(encounter); closeMenu()"
                      class="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Duplicate
                    </button>
                    <hr class="border-gray-600 my-1">
                    <button
                      @click="deleteEncounter(encounter.id); closeMenu()"
                      class="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:text-red-300 hover:bg-gray-600 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Monster List Section -->
          <div class="px-6 pb-6">
            <div v-if="encounter.monsters && encounter.monsters.length > 0">
              <h4 class="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 5.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                Monsters in Encounter
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div
                  v-for="encounterMonster in encounter.monsters"
                  :key="encounterMonster.id"
                  class="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div class="flex justify-between items-start mb-2">
                    <h5 class="font-semibold text-white">
                      {{ encounterMonster.monster_template?.name || 'Unknown Monster' }}
                    </h5>
                    <button
                      @click="removeMonsterFromEncounter(encounterMonster.id)"
                      class="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-600 transition-colors"
                      title="Remove monster (feature coming soon)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div class="flex items-center justify-between text-sm">
                    <span class="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                      ×{{ encounterMonster.quantity }}
                    </span>
                    
                    <div v-if="encounterMonster.monster_template" class="text-gray-300 text-xs">
                      <div>HP: {{ encounterMonster.monster_template.hit_points }}</div>
                      <div>AC: {{ encounterMonster.monster_template.armor_class }}</div>
                      <div v-if="encounterMonster.monster_template.challenge_rating">
                        CR: {{ encounterMonster.monster_template.challenge_rating }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="bg-gray-700 rounded-lg p-8 text-center border-2 border-dashed border-gray-600">
              <svg class="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p class="text-gray-400 mb-3">No monsters in this encounter yet</p>
              <button
                @click="addMonsterToEncounter(encounter)"
                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium inline-flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add First Monster
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty states -->
      <div v-else-if="searchQuery || difficultyFilter" class="text-center py-16">
        <svg class="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-400 mb-2">No encounters match your filters</h3>
        <p class="text-gray-500 mb-4">Try adjusting your search or difficulty filters</p>
        <button
          @click="clearFilters"
          class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <div v-else class="text-center py-16">
        <div class="bg-gray-800 rounded-xl p-12 max-w-md mx-auto border border-gray-700">
          <svg class="w-20 h-20 text-gray-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <h3 class="text-xl font-semibold text-gray-400 mb-3">No encounters created yet</h3>
          <p class="text-gray-500 mb-6">Build your first encounter by combining monsters</p>
          <button
            @click="showCreateModal = true"
            class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium inline-flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Encounter
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Encounter Modal -->
    <div v-if="showCreateModal || editingEncounter" 
         class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700 shadow-2xl">
        <div class="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 class="text-2xl font-bold text-white">
            {{ editingEncounter ? 'Edit Encounter' : 'Create New Encounter' }}
          </h2>
          <button
            @click="closeEncounterModal"
            class="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="saveEncounter" class="p-6 space-y-6">
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Encounter Name *</label>
            <input
              v-model="encounterForm.name"
              type="text"
              required
              class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
              placeholder="e.g., Goblin Ambush, Dragon's Lair"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Description</label>
            <textarea
              v-model="encounterForm.description"
              rows="4"
              class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all resize-none"
              placeholder="Describe the scene, terrain, and context..."
            ></textarea>
          </div>

          <div class="flex gap-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              @click="closeEncounterModal"
              class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors font-medium"
            >
              {{ isSubmitting ? 'Saving...' : (editingEncounter ? 'Update Encounter' : 'Create Encounter') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Monster to Encounter Modal -->
    <div v-if="showMonsterModal" 
         class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 rounded-xl w-full max-w-3xl border border-gray-700 shadow-2xl max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 class="text-2xl font-bold text-white">
            Add Monsters to "{{ selectedEncounter?.name }}"
          </h2>
          <button
            @click="closeMonsterModal"
            class="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6 flex-1 overflow-auto">
          <div v-if="combatStore.monsters.length === 0" class="text-center py-12">
            <svg class="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <h3 class="text-lg font-semibold text-gray-400 mb-2">No monsters available</h3>
            <p class="text-gray-500 mb-4">Create some monsters first</p>
            <router-link
              to="/gm/monsters"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go to Monster Library
            </router-link>
          </div>
          
          <div v-else class="space-y-4">
            <!-- Monster grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              <div
                v-for="monster in combatStore.monsters"
                :key="monster.id"
                @click="selectMonster(monster)"
                :class="[
                  'bg-gray-700 rounded-lg p-4 cursor-pointer border-2 transition-all',
                  selectedMonster?.id === monster.id ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-transparent hover:border-gray-500'
                ]"
              >
                <h4 class="font-semibold text-white mb-2">{{ monster.name }}</h4>
                <div class="text-sm text-gray-300 space-y-1">
                  <div class="flex justify-between">
                    <span>HP:</span><span>{{ monster.hit_points }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>AC:</span><span>{{ monster.armor_class }}</span>
                  </div>
                  <div v-if="monster.challenge_rating" class="flex justify-between">
                    <span>CR:</span><span>{{ monster.challenge_rating }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selected monster and quantity -->
            <div v-if="selectedMonster" class="border-t border-gray-600 pt-4">
              <div class="bg-gray-700 rounded-lg p-4 mb-4">
                <h4 class="text-lg font-semibold text-white mb-2">{{ selectedMonster.name }}</h4>
              </div>
              
              <div class="flex items-center gap-4">
                <label class="text-sm font-semibold text-gray-300">Quantity:</label>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="monsterQuantity = Math.max(1, monsterQuantity - 1)"
                    class="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                  >
                    -
                  </button>
                  <input
                    v-model.number="monsterQuantity"
                    type="number"
                    min="1"
                    max="20"
                    class="w-16 p-2 bg-gray-700 border border-gray-600 rounded text-white text-center focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    @click="monsterQuantity = Math.min(20, monsterQuantity + 1)"
                    class="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedMonster" class="p-6 border-t border-gray-700 flex gap-4">
          <button
            @click="closeMonsterModal"
            class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            @click="addSelectedMonster"
            :disabled="isSubmitting"
            class="flex-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors font-medium"
          >
            {{ isSubmitting ? 'Adding...' : `Add ${monsterQuantity} ${selectedMonster.name}${monsterQuantity > 1 ? 's' : ''}` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Menu state and handlers
const openMenuId = ref<string | null>(null)

const toggleEncounterMenu = (encounterId: string) => {
  openMenuId.value = openMenuId.value === encounterId ? null : encounterId
}

const closeMenu = () => {
  openMenuId.value = null
}
import { ref, onMounted, computed, watch } from 'vue'
import { useCombatStore } from '../../stores/combat'
import type { CombatEncounterMonster, CombatEncounterWithMonsters, MonsterTemplate } from '../../types/combat'

const combatStore = useCombatStore()

// Modal state
const showCreateModal = ref(false)
const editingEncounter = ref<CombatEncounterWithMonsters | null>(null)
const isSubmitting = ref(false)

// Add Monster Modal state
const showMonsterModal = ref(false)
const selectedEncounter = ref<CombatEncounterWithMonsters | null>(null)
const selectedMonster = ref<MonsterTemplate | null>(null)
const monsterQuantity = ref(1)

// Search and filter state
const searchQuery = ref('')
const difficultyFilter = ref('')

// Form data
const encounterForm = ref({
  name: '',
  description: ''
})

// Computed properties
const filteredEncounters = computed(() => {
  let result = combatStore.encounters

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(encounter => 
      encounter.name.toLowerCase().includes(query) ||
      encounter.description?.toLowerCase().includes(query) ||
      encounter.monsters.some((em: CombatEncounterMonster) => 
        em.monster_template?.name.toLowerCase().includes(query)
      )
    )
  }

  // Filter by difficulty
  if (difficultyFilter.value) {
    result = result.filter(encounter => {
      const difficulty = getEncounterDifficulty(encounter)
      return difficulty.toLowerCase() === difficultyFilter.value.toLowerCase()
    })
  }

  return result
})

// Duplicate Encounter
const duplicateEncounter = async (encounter: CombatEncounterWithMonsters) => {
  try {
    const duplicateData = {
      name: `${encounter.name} (Copy)`,
      description: encounter.description
    }
    const newEncounter = await combatStore.createEncounter(duplicateData)
    // Optionally, duplicate monsters in the encounter
    if (encounter.monsters && encounter.monsters.length > 0) {
      for (const monster of encounter.monsters) {
        await combatStore.addMonsterToEncounter(newEncounter.id, monster.monster_template_id, monster.quantity)
      }
    }
  } catch (error) {
    console.error('Failed to duplicate encounter:', error)
  }
}

// Delete Encounter
const deleteEncounter = async (id: string) => {
  if (!confirm('Are you sure you want to delete this encounter? This action cannot be undone.')) return
  try {
    await combatStore.deleteEncounter(id)
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
    // Refresh encounters to show the new monster
    await combatStore.fetchEncounters()
  } catch (error) {
    console.error('Failed to add monster to encounter:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Close Add Monster Modal
const closeMonsterModal = () => {
  showMonsterModal.value = false
  selectedEncounter.value = null
  selectedMonster.value = null
  monsterQuantity.value = 1
}

// Remove monster from encounter
const removeMonsterFromEncounter = async (encounterMonsterId: string) => {
  isSubmitting.value = true
  try {
    // Find the encounter containing this monster
    const encounter = combatStore.encounters.find(enc => enc.monsters.some(em => em.id === encounterMonsterId))
    await combatStore.removeMonsterFromEncounter(encounterMonsterId, encounter?.id)
    await combatStore.fetchEncounters()
  } catch (error) {
    console.error('Failed to remove monster from encounter:', error)
    // Optionally show error to user
  } finally {
    isSubmitting.value = false
  }
}

// Computed: Encounter statistics
const easyEncounters = computed(() => {
  return combatStore.encounters.filter(encounter => 
    getEncounterDifficulty(encounter) === 'Easy'
  ).length
})

const mediumEncounters = computed(() => {
  return combatStore.encounters.filter(encounter => 
    getEncounterDifficulty(encounter) === 'Medium'
  ).length
})

const deadlyEncounters = computed(() => {
  return combatStore.encounters.filter(encounter => 
    getEncounterDifficulty(encounter) === 'Deadly'
  ).length
})

// Close Encounter Modal handler
const closeEncounterModal = () => {
  showCreateModal.value = false
  editingEncounter.value = null
  encounterForm.value.name = ''
  encounterForm.value.description = ''
}

// Save/Create Encounter
const saveEncounter = async () => {
  isSubmitting.value = true
  try {
    const data = {
      name: encounterForm.value.name.trim(),
      description: encounterForm.value.description.trim()
    }
    if (editingEncounter.value) {
      // Update existing encounter
      await combatStore.updateEncounter(editingEncounter.value.id, data)
    } else {
      // Create new encounter
      await combatStore.createEncounter(data)
    }
    // Refresh encounters and close modal
    await combatStore.fetchEncounters()
    closeEncounterModal()
  } catch (error) {
    console.error('Failed to save encounter:', error)
    // Optionally show error to user
  } finally {
    isSubmitting.value = false
  }
}

// Edit Encounter handler
const editEncounter = (encounter: CombatEncounterWithMonsters) => {
  editingEncounter.value = encounter
  encounterForm.value.name = encounter.name
  encounterForm.value.description = encounter.description || ''
  showCreateModal.value = true
}

// Helper functions
const getEncounterDifficulty = (encounter: CombatEncounterWithMonsters) => {
  // Simple difficulty calculation based on number of monsters and their CR
  const totalMonsters = getTotalMonsters(encounter)
  const avgCR = parseFloat(getAverageCR(encounter))
  
  if (totalMonsters === 0) return 'Unknown'
  if (totalMonsters >= 8 || avgCR >= 10) return 'Deadly'
  if (totalMonsters >= 4 || avgCR >= 5) return 'Hard'
  if (totalMonsters >= 2 || avgCR >= 2) return 'Medium'
  return 'Easy'
}

const getDifficultyBadgeClass = (encounter: CombatEncounterWithMonsters) => {
  const difficulty = getEncounterDifficulty(encounter)
  switch (difficulty) {
    case 'Easy': return 'bg-green-600 text-green-100'
    case 'Medium': return 'bg-yellow-600 text-yellow-100'
    case 'Hard': return 'bg-orange-600 text-orange-100'
    case 'Deadly': return 'bg-red-600 text-red-100'
    default: return 'bg-gray-600 text-gray-100'
  }
}

const getTotalMonsters = (encounter: CombatEncounterWithMonsters) => {
  return encounter.monsters.reduce((total: number, em: CombatEncounterMonster) => total + em.quantity, 0)
}

const getAverageCR = (encounter: CombatEncounterWithMonsters) => {
  if (!encounter.monsters.length) return '0'
  
  const totalCR = encounter.monsters.reduce((sum: number, em: CombatEncounterMonster) => {
    const cr = parseFloat(em.monster_template?.challenge_rating || '0')
    return sum + (cr * em.quantity)
  }, 0)
  
  const totalMonsters = getTotalMonsters(encounter)
  return totalMonsters > 0 ? (totalCR / totalMonsters).toFixed(1) : '0'
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Additional functionality placeholders
const startCombatFromEncounter = async (encounter: CombatEncounterWithMonsters) => {
  // TODO: Implement combat starting functionality
  console.log('Start combat from encounter:', encounter.name)
  alert('Start combat feature coming soon!')
}

// Load data on mount
onMounted(async () => {
  await Promise.all([
    combatStore.fetchEncounters(),
    combatStore.fetchMonsters()
  ])
})

</script>

<style scoped>
.encounters-view {
  min-height: 100vh;
  height: 100vh;
  overflow-y: auto;
  background-color: #18181b !important;
}

.bg-gray-800.rounded-xl.border {
  background-color: #23232a !important;
  border-color: #222 !important;
}

.p-6 {
  background-color: #18181b !important;
}

.bg-gray-700.rounded-lg.p-4 {
  background-color: #23232a !important;
  border-color: #222 !important;
}

.text-gray-300, .text-gray-400, .text-gray-500 {
  color: #b3b3b3 !important;
}

.text-white {
  color: #e5e5e5 !important;
}
</style>