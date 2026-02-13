import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Стили
import './styles/minecraft.css'
// import './styles/main.css'

// Роутер
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      component: () => import('./views/HomeView.vue') 
    }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')