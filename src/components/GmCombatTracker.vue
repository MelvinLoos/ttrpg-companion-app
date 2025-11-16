<template>
  <header class="combat-header bg-stone-900 text-stone-100 border-b p-6">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white">Combat Tracker</h1>
        <p class="text-stone-400 mt-1">Build and manage encounters for your sessions</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <span v-if="combatStore.activeCombat" class="text-sm text-stone-200">
          Round {{ combatStore.activeCombat.round_number }}
        </span>
        <span v-if="combatStore.activeCombat?.encounter" class="text-sm text-stone-400 ml-3">
          {{ combatStore.activeCombat.encounter.name }}
        </span>
      </div>

      <div class="flex gap-3">
        <button
        @click="nextTurn"
        :disabled="!combatStore.activeCombat || combatStore.isLoading"
        class="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer bg-linear-to-br from-green-700 to-green-900 text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-800 hover:to-green-950 hover:-translate-y-0.5"
        >
          Next Turn
        </button>
        <button
        @click="endCombat"
        :disabled="!combatStore.activeCombat || combatStore.isLoading"
        class="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer bg-linear-to-br from-red-700 to-red-900 text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed hover:from-red-800 hover:to-red-950 hover:-translate-y-0.5"
        >
          End Combat
        </button>
      </div>
    </div>
  </header>

  <!-- No Active Combat -->
  <div v-if="!combatStore.activeCombat" class="text-center py-8 text-stone-400">
    <p>No active combat. Use the "Start Combat" button to begin.</p>
  </div>

  <!-- Combat Participants -->
  <div v-else class="mt-4">
    <h3 class="text-lg font-semibold text-white mb-4">Participants</h3>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 items-stretch">
      <!-- Initiative Header -->
      <span class="flex items-center justify-center h-16 py-2 border-b border-white border-opacity-10 mb-2 text-sm font-medium text-stone-300">Initiative</span>
      <span class="flex items-center justify-center h-16 py-2 border-b border-white border-opacity-10 mb-2 text-sm font-medium text-stone-300">Name</span>
      <span class="flex items-center justify-center h-16 py-2 border-b border-white border-opacity-10 mb-2 text-sm font-medium text-stone-300">Type</span>
      <span class="flex items-center justify-center h-16 py-2 border-b border-white border-opacity-10 mb-2 text-sm font-medium text-stone-300">Health</span>
      <span class="flex items-center justify-center h-16 py-2 border-b border-white border-opacity-10 mb-2 text-sm font-medium text-stone-300">Status</span>
      <span class="flex items-center justify-center h-16 py-2 border-b border-white border-opacity-10 mb-2 text-sm font-medium text-stone-300">Actions</span>

      <!-- Participants -->
      <template v-for="participant in combatStore.sortedParticipants" :key="participant.id">
        <div
          v-for="col in 6"
          :key="col"
          :class="[
            'flex items-center justify-center h-16 py-3 px-2 rounded-md mb-2 min-w-0',
            participant.id === combatStore.activeCombat?.current_turn_id ? 'bg-blue-900 bg-opacity-80 border-blue-500 border-2 shadow-lg' : 'bg-stone-900 bg-opacity-80 border border-white border-opacity-5',
            col === 1 ? '' : '',
          ]"
        >
          <template v-if="col === 1">
            <input
              v-model.number="participant.initiative"
              @blur="updateInitiative(participant.id, participant.initiative)"
              type="number"
              class="w-full max-w-[70px] py-1 px-2 bg-black bg-opacity-40 border border-white border-opacity-20 rounded text-white text-center text-sm box-border focus:outline-none focus:border-blue-600"
              placeholder="--"
            />
          </template>
          <template v-else-if="col === 2">
            <span class="font-semibold text-white">{{ participant.name }}</span>
            <span v-if="participant.id === combatStore.activeCombat?.current_turn_id" class="text-blue-400 text-xs font-medium ml-2">← Current</span>
          </template>
          <template v-else-if="col === 3">
            <span :class="['px-2 py-1 rounded text-xs font-medium uppercase', participant.type === 'player' ? 'bg-green-700 bg-opacity-40 text-green-200' : 'bg-red-700 bg-opacity-40 text-red-200']">
              {{ participant.type === 'player' ? 'Player' : 'Monster' }}
            </span>
          </template>
          <template v-else-if="col === 4">
            <div v-if="participant.type === 'monster' && participant.current_hit_points !== null" class="w-full">
              <div class="flex items-center gap-1 mb-2">
                <button
                  @click="adjustHealth(participant, -1)"
                  class="w-6 h-6 rounded font-bold text-sm cursor-pointer transition bg-red-700 text-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="participant.current_hit_points <= 0"
                >
                  -
                </button>
                <input
                  v-model.number="participant.current_hit_points"
                  @blur="updateHealth(participant.id, participant.current_hit_points)"
                  type="number"
                  min="0"
                  :max="participant.max_hit_points || 100"
                  class="w-full max-w-[70px] py-1 bg-black bg-opacity-40 border border-white border-opacity-20 rounded text-white text-center text-xs box-border"
                />
                <span class="text-stone-400 text-xs">/{{ participant.max_hit_points }}</span>
                <button
                  @click="adjustHealth(participant, 1)"
                  class="w-6 h-6 rounded font-bold text-sm cursor-pointer transition bg-green-700 text-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="(participant.current_hit_points || 0) >= (participant.max_hit_points || 0)"
                >
                  +
                </button>
              </div>
              <!-- Health Bar -->
              <div class="h-1 bg-stone-800 bg-opacity-60 rounded overflow-hidden">
                <div
                  class="h-full transition-all"
                  :class="getHealthBarClass(participant.health_percentage || 0)"
                  :style="{ width: `${participant.health_percentage || 0}%` }"
                ></div>
              </div>
            </div>
            <span v-else class="text-stone-500">N/A</span>
          </template>
          <template v-else-if="col === 5">
            <span
              v-if="participant.health_status"
              :class="['mr-2 px-2 py-1 rounded text-xs font-medium', getStatusClass(participant.health_status)]"
            >
              {{ participant.health_status }}
            </span>
            <span v-else class="text-stone-500">--</span>
          </template>
          <template v-else-if="col === 6">
            <button
              @click="removeParticipant(participant.id)"
              class="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer bg-red-700 text-white shadow-md transition hover:bg-red-800 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove participant"
            >
              Remove
            </button>
          </template>
        </div>
  <!-- End participant row -->
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCombatStore } from '../stores/combat'
import type { CombatParticipantWithType } from '../types/combat'

const combatStore = useCombatStore()

// Advance turn
const nextTurn = async () => {
  try {
    await combatStore.nextTurn()
  } catch (error) {
    console.error('Failed to advance turn:', error)
  }
}

// End combat
const endCombat = async () => {
  if (!confirm('Are you sure you want to end combat?')) return
  try {
    await combatStore.endCombat()
  } catch (error) {
    console.error('Failed to end combat:', error)
  }
}

// Update initiative
const updateInitiative = async (participantId: string, initiative: number | null) => {
  if (participantId && initiative !== null) {
    await combatStore.updateParticipantInitiative(participantId, initiative)
  }
}

// Update health
const updateHealth = async (participantId: string, currentHitPoints: number | null) => {
  if (participantId && currentHitPoints !== null) {
    await combatStore.updateParticipantHealth(participantId, currentHitPoints)
  }
}

// Adjust health +/-
function adjustHealth(participant: CombatParticipantWithType, delta: number) {
  if (participant && typeof participant.current_hit_points === 'number') {
    const newHp = Math.max(0, (participant.current_hit_points || 0) + delta)
    updateHealth(participant.id, newHp)
  }
}

// Remove participant
function removeParticipant(participantId: string) {
  if (participantId) {
    combatStore.removeParticipant(participantId)
  }
}

// Health bar color
function getHealthBarClass(percentage: number) {
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 40) return 'bg-yellow-500';
  if (percentage > 0) return 'bg-red-700';
  return 'bg-stone-700';
}

// Status color
function getStatusClass(status: string) {
  switch (status) {
    case 'Unharmed': return 'bg-green-800 text-green-100';
    case 'Injured': return 'bg-yellow-700 text-yellow-100';
    case 'Bloodied': return 'bg-red-800 text-red-100';
    case 'Near Death': return 'bg-red-950 text-red-100';
    case 'Defeated': return 'bg-stone-800 text-stone-300';
    default: return 'bg-stone-900 text-stone-200';
  }
}
</script>

<style scoped>
</style>