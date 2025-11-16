<template>
  <div class="gm-layout bg-stone-900 text-stone-100">
    <header>
      <div class="header-left">
        <h1>GM Control Panel</h1>
        <nav>
          <router-link :to="{ name: 'gm-lobby' }">Lobby</router-link>
          <router-link :to="{ name: 'gm-sessions' }">Sessions</router-link>
          <router-link :to="{ name: 'gm-characters' }">Characters</router-link>
          <router-link :to="{ name: 'gm-monsters' }">Monsters</router-link>
          <router-link :to="{ name: 'gm-encounters' }">Encounters</router-link>
          <router-link :to="{ name: 'gm-combat' }">Combat</router-link>
          <router-link :to="{ name: 'gm-assets' }">Assets</router-link>
        </nav>
      </div>
      <div class="user-menu" v-if="authStore.user">
        <div class="user-info" @click="toggleMenu">
          <span class="user-email">{{ authStore.user.email }}</span>
          <span class="menu-arrow" :class="{ 'rotated': showMenu }">▼</span>
        </div>
        <div v-if="showMenu" class="menu-dropdown" @click.stop>
          <button @click="handleSignOut" :disabled="loading">
            {{ loading ? 'Signing out...' : 'Sign Out' }}
          </button>
        </div>
      </div>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const showMenu = ref(false)
const loading = ref(false)

const toggleMenu = () => {
  console.log('Toggle menu clicked, current state:', showMenu.value)
  showMenu.value = !showMenu.value
  console.log('New menu state:', showMenu.value)
}

const closeMenu = () => {
  showMenu.value = false
}

// Close menu when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.user-menu')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

async function handleSignOut() {
  loading.value = true
  closeMenu() // Close the menu before signing out
  
  const success = await authStore.signOut()
  loading.value = false
  
  if (success) {
    router.push('/sign-in')
  }
}
</script>

<style scoped>
.gm-layout {
  min-height: 100vh;
  height: calc(100vh - 2rem);
  padding: 0.5rem;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 1rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
}

nav {
  display: flex;
  gap: 0.5rem;
}

nav a {
  padding: 0.4rem 0.8rem;
  border-radius: 0.25rem;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

nav a:hover {
  background: rgba(255, 255, 255, 0.1);
}

nav a.router-link-active {
  background: rgba(255, 255, 255, 0.2);
}

.user-menu {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-email {
  font-size: 0.9rem;
}

.menu-arrow {
  font-size: 0.8rem;
  opacity: 0.7;
  transition: transform 0.2s ease;
}

.menu-arrow.rotated {
  transform: rotate(180deg);
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #1a1a1a;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 150px;
}

.menu-dropdown button {
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  background: none;
  border: none;
  border-radius: 0.25rem;
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
}

.menu-dropdown button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.menu-dropdown button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

main {
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
</style>