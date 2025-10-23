import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/gm',
    component: () => import('../views/Gm/GmLayout.vue'),
    children: []
  },
  {
    path: '/screen/:session_id',
    component: () => import('../views/Screen/ScreenLayout.vue'),
    children: []
  },
  {
    path: '/join/:session_id',
    component: () => import('../views/Join/JoinLayout.vue'),
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