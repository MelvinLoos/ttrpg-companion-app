<template>
  <div class="combat-view min-h-screen">
    <GmCombatTracker v-if="sessionId" :session-id="sessionId" />
    <div v-else class="text-center py-16 text-stone-400">
      <p>Select an active session from the lobby to manage combat.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '../../stores/session'
import GmCombatTracker from '../../components/GmCombatTracker.vue'

const sessionStore = useSessionStore()

const sessionId = computed(() => sessionStore.state.currentSession?.id ?? null)
</script>

<style scoped>
</style>