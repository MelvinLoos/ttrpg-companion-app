<template>
  <div class="lobby-view">
    <h2>Game Lobby</h2>
    <div class="lobby-content">
      <div class="waiting-players">
        <h3>Waiting Players</h3>
        <!-- Players waiting to join will be listed here -->
        <p>No players waiting</p>
      </div>
      <div class="session-info">
        <h3>Session Information</h3>
        <!-- Session details will be displayed here -->
        <p>No active session</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// LobbyView component logic will go here
</script>

<style scoped>
.lobby-view {
  padding: 1rem;
}

.lobby-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 1rem;
}

.waiting-players,
.session-info {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>