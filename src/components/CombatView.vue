<template>
  <div class="combat-view">
    <GmCombatTracker />
  </div>
</template>

<script setup lang="ts">
import GmCombatTracker from './GmCombatTracker.vue'
</script>

<style scoped>
.combat-view {
  padding: 1rem;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}
</style>