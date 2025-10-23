import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from './plugins/router'
import { useAuthStore } from './stores/auth'
import App from './App.vue'

import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store
const authStore = useAuthStore()
await authStore.initialize()

app.mount('#app')
