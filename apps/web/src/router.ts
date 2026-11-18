import { createRouter, createWebHistory } from 'vue-router'
import WallView from './views/WallView.vue'
import ChatView from './views/ChatView.vue'
import AiView from './views/AiView.vue'
import ActivitiesView from './views/ActivitiesView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/wall' },
    { path: '/wall', name: 'wall', component: WallView },
    { path: '/chat', name: 'chat', component: ChatView },
    { path: '/ai', name: 'ai', component: AiView },
    { path: '/activities', name: 'activities', component: ActivitiesView }
  ]
})

export default router
