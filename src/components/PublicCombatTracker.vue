<template>
  <div class="public-combat-tracker">
    <!-- Combat Header -->
    <div class="combat-header">
      <h3 class="combat-title">Combat</h3>
      <div v-if="combatStore.activeCombat" class="combat-round">
        Round {{ combatStore.activeCombat.round_number }}
      </div>
    </div>

    <!-- No Active Combat -->
    <div v-if="!combatStore.activeCombat" class="no-combat">
      <p class="no-combat-text">No active combat</p>
    </div>

  <!-- Initiative Order -->
  <div v-else class="initiative-list" ref="initiativeListRef">
      <div
        v-for="participant in combatStore.sortedParticipants"
        :key="participant.id"
        :class="[
          'participant',
          { 
            'current-turn': participant.id === combatStore.activeCombat?.current_turn_id,
            'defeated': participant.health_status === 'Defeated'
          }
        ]"
      >
        <!-- Initiative and Name -->
        <div class="participant-info">
          <div class="initiative-badge">
            {{ participant.initiative || '--' }}
          </div>
          <div class="participant-details">
            <div class="participant-name">
              {{ participant.name }}
            </div>
            <div class="participant-type">
              {{ participant.type === 'player' ? 'Player' : 'Monster' }}
            </div>
          </div>
        </div>

        <!-- Health Status for Monsters -->
        <div v-if="participant.type === 'monster'" class="health-status">
          <div class="health-indicator">
            <div 
              class="health-bar"
              :class="getHealthBarClass(participant.health_status || 'Unharmed')"
            >
              <div 
                class="health-fill"
                :style="{ width: `${participant.health_percentage || 0}%` }"
              ></div>
            </div>
            <span 
              class="health-text"
              :class="getHealthTextClass(participant.health_status || 'Unharmed')"
            >
              {{ participant.health_status || 'Unknown' }}
            </span>
          </div>
        </div>

        <!-- Current Turn Indicator -->
        <div v-if="participant.id === combatStore.activeCombat?.current_turn_id" class="turn-indicator">
          <svg class="turn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.58L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.58Z"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { useCombatStore } from '../stores/combat'

interface Props {
  sessionId: string
}

const props = defineProps<Props>()
const combatStore = useCombatStore()

// Ref to the scrollable initiative list container
const initiativeListRef = ref<HTMLElement | null>(null)

/**
 * Scroll the initiative list so the element with class `current-turn` is visible.
 * Only performs scrolling when the container actually overflows (has a scrollbar).
 */
const scrollToCurrent = async (behavior: ScrollBehavior = 'smooth') => {
  await nextTick()
  const container = initiativeListRef.value
  if (!container) return

  // Only scroll when there's overflow
  if (container.scrollHeight <= container.clientHeight) return

  const currentEl = container.querySelector('.current-turn') as HTMLElement | null
  if (!currentEl) return

  // Compute target so the current element is centered (or at least fully visible)
  const elTop = currentEl.offsetTop
  const elHeight = currentEl.offsetHeight
  const target = Math.max(0, elTop - (container.clientHeight / 2) + (elHeight / 2))

  try {
    container.scrollTo({ top: target, behavior })
  } catch (e) {
    // Fallback for older browsers
    container.scrollTop = target
  }
}

// Helper functions for health status styling
const getHealthBarClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'defeated': return 'health-bar-defeated'
    case 'near death': return 'health-bar-critical'
    case 'bloodied': return 'health-bar-bloodied'
    case 'injured': return 'health-bar-injured'
    default: return 'health-bar-healthy'
  }
}

const getHealthTextClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'defeated': return 'health-text-defeated'
    case 'near death': return 'health-text-critical'
    case 'bloodied': return 'health-text-bloodied'
    case 'injured': return 'health-text-injured'
    default: return 'health-text-healthy'
  }
}

// Load combat data when component mounts or session changes
const loadCombatData = async () => {
  if (props.sessionId) {
    await combatStore.fetchActiveCombat(props.sessionId)
  }
}

onMounted(loadCombatData)

// Scroll when the component mounts (after data loads) and when the current turn changes
onMounted(() => {
  // Ensure we try to scroll after initial render
  void scrollToCurrent('auto')
})

watch(() => combatStore.activeCombat?.current_turn_id, () => {
  void scrollToCurrent('smooth')
})

watch(() => props.sessionId, loadCombatData)

// Real-time subscriptions setup would go here
// This would listen to changes in active_combats and combat_participants tables
onUnmounted(() => {
  // Clean up subscriptions
})
</script>

<style scoped>
.public-combat-tracker {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  width: 100%;
  max-height: 75vh;
  overflow-y: auto;
}

.combat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.combat-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.combat-round {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
}

.no-combat {
  text-align: center;
  padding: 2rem 1rem;
}

.no-combat-text {
  color: #6b7280;
  font-style: italic;
  margin: 0;
}

.initiative-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.participant {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  position: relative;
}

.participant.current-turn {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.participant.defeated {
  opacity: 0.5;
}

.participant-info {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 1rem;
}

.initiative-badge {
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.participant.current-turn .initiative-badge {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #60a5fa;
}

.participant-details {
  flex: 1;
}

.participant-name {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
}

.participant-type {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.health-status {
  flex-shrink: 0;
  min-width: 120px;
}

.health-indicator {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.health-bar {
  width: 100px;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
  position: relative;
}

.health-fill {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 3px;
}

.health-bar-healthy .health-fill {
  background: #16a34a;
}

.health-bar-injured .health-fill {
  background: #eab308;
}

.health-bar-bloodied .health-fill {
  background: #f97316;
}

.health-bar-critical .health-fill {
  background: #dc2626;
}

.health-bar-defeated .health-fill {
  background: #6b7280;
}

.health-text {
  font-size: 0.75rem;
  font-weight: 500;
}

.health-text-healthy {
  color: #4ade80;
}

.health-text-injured {
  color: #facc15;
}

.health-text-bloodied {
  color: #fb923c;
}

.health-text-critical {
  color: #f87171;
}

.health-text-defeated {
  color: #9ca3af;
}

.turn-indicator {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #3b82f6;
  animation: pulse 2s infinite;
}

.turn-icon {
  width: 1.5rem;
  height: 1.5rem;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .public-combat-tracker {
    padding: 0.75rem;
  }
  
  .participant {
    padding: 0.75rem;
  }
  
  .participant-info {
    gap: 0.75rem;
  }
  
  .health-status {
    min-width: 100px;
  }
  
  .health-bar {
    width: 80px;
  }
}
</style>