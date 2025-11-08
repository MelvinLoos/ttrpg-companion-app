<template>
  <div class="combat-view">
    <h2>Combat Tracker</h2>
    <div class="combat-content">
      <div class="initiative-order">
        <h3>Initiative Order</h3>
        <!-- Initiative order will be displayed here -->
        <p>No combat in progress</p>
      </div>
      <div class="active-effects">
        <h3>Active Effects</h3>
        <!-- Active effects and conditions will be listed here -->
        <p>No active effects</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// CombatView component logic will go here
</script>

<style scoped>
.combat-view {
  padding: 0.25rem;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.combat-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-top: 1rem;
}

.initiative-order,
.active-effects {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>