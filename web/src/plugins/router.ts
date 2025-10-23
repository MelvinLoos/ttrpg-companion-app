import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import GmLayout from '../views/Gm/GmLayout.vue'
import LobbyView from '../components/LobbyView.vue'
import ScreenLayout from '../views/Screen/ScreenLayout.vue'
import JoinLayout from '../views/Join/JoinLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/gm',
    component: () => GmLayout,
    children: [
      {
        path: '',
        name: 'gm-lobby',
        component: () => LobbyView,
      },
      {
        path: 'combat',
        name: 'gm-combat',
        component: () => import('../components/CombatView.vue')
      }
    ]
  },
  {
    path: '/screen/:session_id',
    component: () => ScreenLayout,
    children: []
  },
  {
    path: '/join/:session_id',
    component: () => JoinLayout,
    children: []
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