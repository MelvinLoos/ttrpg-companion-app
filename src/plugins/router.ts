import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import GmLayout from '../views/Gm/GmLayout.vue'
import LobbyView from '../views/Gm/LobbyView.vue'
import ScreenLayout from '../views/Screen/ScreenLayout.vue'
import JoinLayout from '../views/Join/JoinLayout.vue'
import SignInView from '../views/SignInView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/sign-in',
    name: 'sign-in',
    component: SignInView
  },
  {
    path: '/gm',
    component: GmLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'gm-lobby',
        component: LobbyView,
      },
      {
        path: 'sessions',
        name: 'gm-sessions',
        component: () => import('../views/Gm/SessionsView.vue')
      },
      {
        path: 'characters',
        name: 'gm-characters',
        component: () => import('../views/Gm/CharactersView.vue')
      },
      {
        path: 'monsters',
        name: 'gm-monsters',
        component: () => import('../views/Gm/MonstersView.vue')
      },
      {
        path: 'encounters',
        name: 'gm-encounters',
        component: () => import('../views/Gm/EncountersView.vue')
      },
      {
        path: 'combat',
        name: 'gm-combat',
        component: () => import('../views/Gm/CombatView.vue')
      },
      {
        path: 'assets',
        name: 'gm-assets',
        component: () => import('../views/Gm/AssetsView.vue')
      }
    ]
  },
  {
    path: '/screen/:session_id',
    name: 'player-screen',
    component: ScreenLayout
  },
  {
    path: '/join/:session_id',
    component: JoinLayout,
    children: [
      {
        path: '',
        name: 'player-join',
        component: () => import('../views/Join/PlayerJoinView.vue')
      },
      {
        path: 'success',
        name: 'join-success',
        component: () => import('../views/Join/JoinSuccessView.vue')
      }
    ]
  },
  {
    path: '/',
    redirect: '/gm'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/gm'
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for protected routes
router.beforeEach(async (to) => {
  // Allow dev mode to skip authentication for testing via env flag.
  // This replaces the hardcoded early return that silently disabled auth.
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'

  if (to.meta.requiresAuth) {
    if (skipAuth) {
      console.log(
        `%c🔓 [Router] Auth guard skipped for ${to.fullPath} (VITE_SKIP_AUTH=true)`,
        'color: #ff9800;'
      )
      return
    }

    const authStore = useAuthStore()

    // Wait for auth initialization to complete if it's still loading
    while (authStore.loading) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    if (!authStore.isAuthenticated) {
      console.log(
        `%c🔒 [Router] Route ${to.fullPath} requires auth — redirecting to /sign-in`,
        'color: #e94560;'
      )
      return { name: 'sign-in', query: { redirect: to.fullPath } }
    }
  }
})
