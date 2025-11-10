import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import GmLayout from '../views/Gm/GmLayout.vue'
import LobbyView from '../components/LobbyView.vue'
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
        path: 'combat',
        name: 'gm-combat',
        component: () => import('../components/CombatView.vue')
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
    component: ScreenLayout,
    children: [
      {
        path: '',
        name: 'player-screen',
        component: () => import('../views/Screen/PlayerScreenLobby.vue')
      }
    ]
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
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'sign-in', query: { redirect: to.fullPath } }
  }
})