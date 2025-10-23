<template>
  <div class="gm-layout">
    <header>
      <h1>GM Control Panel</h1>
      <nav>
        <router-link :to="{ name: 'gm-lobby' }">Lobby</router-link>
        <router-link :to="{ name: 'gm-combat' }">Combat</router-link>
      </nav>
    </header>
    <PartyBar />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import PartyBar from '../../components/PartyBar.vue'
</script>

<style scoped>
.gm-layout {
  min-height: 100vh;
  padding: 2rem;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 2rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

nav a:hover {
  background: rgba(255, 255, 255, 0.1);
}

nav a.router-link-active {
  background: rgba(255, 255, 255, 0.2);
}

main {
  min-height: 0;
}
</style>