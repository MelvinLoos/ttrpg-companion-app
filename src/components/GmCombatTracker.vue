<template>
  <div class="gm-combat-tracker">
    <!-- Combat Header -->
    <div class="combat-header">
      <div class="combat-info">
        <h2 class="text-xl font-bold text-white">Combat Tracker</h2>
        <div class="combat-meta">
          <span v-if="combatStore.activeCombat" class="text-sm text-gray-300">
            Round {{ combatStore.activeCombat.round_number }}
          </span>
          <span v-if="combatStore.activeCombat?.encounter" class="text-sm text-gray-400 ml-3">
            {{ combatStore.activeCombat.encounter.name }}
          </span>
        </div>
      </div>
      <div class="combat-actions">
        <button
          @click="nextTurn"
          :disabled="!combatStore.activeCombat || combatStore.isLoading"
          class="next-turn-btn"
        >
          Next Turn
        </button>
        <button
          @click="endCombat"
          :disabled="!combatStore.activeCombat || combatStore.isLoading"
          class="end-combat-btn"
        >
          End Combat
        </button>
      </div>
    </div>

    <!-- No Active Combat -->
    <div v-if="!combatStore.activeCombat" class="no-combat">
      <p class="text-gray-400">No active combat. Use the "Start Combat" button to begin.</p>
    </div>

    <!-- Combat Participants -->
    <div v-else class="participants-list">
      <h3 class="text-lg font-semibold text-white mb-4">Participants</h3>
      
      <div class="initiative-grid">
        <!-- Initiative Header -->
        <div class="initiative-header">
          <span class="text-sm font-medium text-gray-300">Initiative</span>
          <span class="text-sm font-medium text-gray-300">Name</span>
          <span class="text-sm font-medium text-gray-300">Type</span>
          <span class="text-sm font-medium text-gray-300">Health</span>
          <span class="text-sm font-medium text-gray-300">Status</span>
        </div>

        <!-- Participants -->
        <div
          v-for="participant in combatStore.sortedParticipants"
          :key="participant.id"
          :class="[
            'participant-row',
            { 
              'current-turn': participant.id === combatStore.activeCombat?.current_turn_id,
              'defeated': participant.health_status === 'Defeated'
            }
          ]"
        >
          <!-- Initiative -->
          <div class="initiative-cell">
            <input
              v-model.number="participant.initiative"
              @blur="updateInitiative(participant.id, participant.initiative)"
              type="number"
              class="initiative-input"
              placeholder="--"
            />
          </div>

          <!-- Name -->
          <div class="name-cell">
            <span class="participant-name">{{ participant.name }}</span>
            <span v-if="participant.id === combatStore.activeCombat?.current_turn_id" 
                  class="current-indicator">← Current</span>
          </div>

          <!-- Type -->
          <div class="type-cell">
            <span :class="['type-badge', participant.type]">
              {{ participant.type === 'player' ? 'Player' : 'Monster' }}
            </span>
          </div>

          <!-- Health -->
          <div class="health-cell">
            <div v-if="participant.type === 'monster' && participant.current_hit_points !== null">
              <div class="health-controls">
                <button
                  @click="adjustHealth(participant, -1)"
                  class="health-btn damage"
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
                  class="health-input"
                />
                <span class="health-max">/{{ participant.max_hit_points }}</span>
                <button
                  @click="adjustHealth(participant, 1)"
                  class="health-btn heal"
                  :disabled="(participant.current_hit_points || 0) >= (participant.max_hit_points || 0)"
                >
                  +
                </button>
              </div>
              
              <!-- Health Bar -->
              <div class="health-bar">
                <div 
                  class="health-fill"
                  :class="getHealthBarClass(participant.health_percentage || 0)"
                  :style="{ width: `${participant.health_percentage || 0}%` }"
                ></div>
              </div>
            </div>
            <span v-else class="text-gray-400">N/A</span>
          </div>

          <!-- Status -->
          <div class="status-cell">
            <span 
              v-if="participant.health_status"
              :class="['status-badge', getStatusClass(participant.health_status)]"
            >
              {{ participant.health_status }}
            </span>
            <span v-else class="text-gray-400">--</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCombatStore } from '../stores/combat'
import type { CombatParticipantWithType } from '../types/combat'

const combatStore = useCombatStore()

// Actions
const nextTurn = async () => {
  try {
    await combatStore.nextTurn()
  } catch (error) {
    console.error('Failed to advance turn:', error)
  }
}

const endCombat = async () => {
  if (!confirm('Are you sure you want to end combat?')) return
  
  try {
    await combatStore.endCombat()
  } catch (error) {
    console.error('Failed to end combat:', error)
  }
}

const updateInitiative = async (participantId: string, initiative: number | null) => {
  if (initiative === null || initiative === undefined) return
  
  try {
    await combatStore.updateParticipantInitiative(participantId, initiative)
  } catch (error) {
    console.error('Failed to update initiative:', error)
  }
}

const updateHealth = async (participantId: string, currentHitPoints: number | null) => {
  if (currentHitPoints === null || currentHitPoints === undefined) return
  
  try {
    await combatStore.updateParticipantHealth(participantId, Math.max(0, currentHitPoints))
  } catch (error) {
    console.error('Failed to update health:', error)
  }
}

const adjustHealth = async (participant: CombatParticipantWithType, adjustment: number) => {
  if (participant.current_hit_points === null) return
  
  const newHealth = Math.max(0, Math.min(
    participant.max_hit_points || 100,
    participant.current_hit_points + adjustment
  ))
  
  await updateHealth(participant.id, newHealth)
}

// Helper functions
const getHealthBarClass = (percentage: number) => {
  if (percentage <= 0) return 'health-defeated'
  if (percentage <= 25) return 'health-critical'
  if (percentage <= 50) return 'health-bloodied'
  if (percentage <= 75) return 'health-injured'
  return 'health-healthy'
}

const getStatusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'defeated': return 'status-defeated'
    case 'near death': return 'status-critical'
    case 'bloodied': return 'status-bloodied'
    case 'injured': return 'status-injured'
    default: return 'status-healthy'
  }
}
</script>

<style scoped>
.gm-combat-tracker {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1rem 0;
}

.combat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
}

.combat-info {
  flex: 1;
}

.combat-meta {
  margin-top: 0.5rem;
}

.combat-actions {
  display: flex;
  gap: 0.75rem;
}

.next-turn-btn, .end-combat-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.next-turn-btn {
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: white;
}

.next-turn-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #15803d, #166534);
  transform: translateY(-1px);
}

.end-combat-btn {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
}

.end-combat-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c, #991b1b);
  transform: translateY(-1px);
}

.next-turn-btn:disabled, .end-combat-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.no-combat {
  text-align: center;
  padding: 2rem;
}

.participants-list {
  margin-top: 1rem;
}

.initiative-grid {
  display: grid;
  grid-template-columns: 80px 1fr 100px 140px 120px;
  gap: 0.5rem;
  align-items: center;
}

.initiative-header {
  display: contents;
}

.initiative-header > span {
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 0.5rem;
}

.participant-row {
  display: contents;
}

.participant-row.current-turn .initiative-cell,
.participant-row.current-turn .name-cell,
.participant-row.current-turn .type-cell,
.participant-row.current-turn .health-cell,
.participant-row.current-turn .status-cell {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.participant-row.defeated {
  opacity: 0.6;
}

.initiative-cell, .name-cell, .type-cell, .health-cell, .status-cell {
  padding: 0.75rem 0.5rem;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.initiative-input {
  width: 60px;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: white;
  text-align: center;
  font-size: 0.875rem;
}

.initiative-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.participant-name {
  font-weight: 600;
  color: white;
}

.current-indicator {
  color: #3b82f6;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
}

.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.type-badge.player {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.type-badge.monster {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.health-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.health-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 0.25rem;
  font-weight: bold;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.health-btn.damage {
  background: #dc2626;
  color: white;
}

.health-btn.heal {
  background: #16a34a;
  color: white;
}

.health-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.health-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.health-input {
  width: 50px;
  padding: 0.25rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: white;
  text-align: center;
  font-size: 0.75rem;
}

.health-max {
  color: #9ca3af;
  font-size: 0.75rem;
}

.health-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.health-fill.health-healthy {
  background: #16a34a;
}

.health-fill.health-injured {
  background: #eab308;
}

.health-fill.health-bloodied {
  background: #f97316;
}

.health-fill.health-critical {
  background: #dc2626;
}

.health-fill.health-defeated {
  background: #6b7280;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.status-healthy {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.status-badge.status-injured {
  background: rgba(234, 179, 8, 0.2);
  color: #facc15;
}

.status-badge.status-bloodied {
  background: rgba(249, 115, 22, 0.2);
  color: #fb923c;
}

.status-badge.status-critical {
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
}

.status-badge.status-defeated {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}
</style>