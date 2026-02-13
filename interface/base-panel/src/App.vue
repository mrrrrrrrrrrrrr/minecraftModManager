<template>
  <div id="app">
    <!-- Хедер -->
    <header class="header">
      <div class="header-content">
        <h1 class="logo">Lava Mods Manager</h1>
        <button class="btn btn-primary" @click="refreshMods">
          Обновить
        </button>
      </div>
    </header>

    <!-- Основной контент -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

// Кастомный курсор
const cursorX = ref(0)
const cursorY = ref(0)

const cursorStyle = computed(() => ({
  left: `${cursorX.value}px`,
  top: `${cursorY.value}px`
}))

const handleMouseMove = (e) => {
  cursorX.value = e.clientX
  cursorY.value = e.clientY
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})

const refreshMods = () => {
  window.location.reload()
}
</script>

<style>
/* Базовые стили */
* {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
}

body {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  min-height: 100vh;
  color: #e2e2e2;
}

/* Кастомный курсор */
.custom-cursor {
  position: fixed;
  width: 32px;
  height: 32px;
  background: url("/images/custom_cursor.png") center/100% no-repeat;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 10000;
  mix-blend-mode: difference;
}

/* Хедер */
.header {
  background: 
    linear-gradient(180deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.4));
  border-bottom: 6px solid black;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
}

.logo {
  font-family: sans-serif;
  color: transparent;
  font-size: 2rem;
  background: linear-gradient(90deg, orangered, orange, coral, orangered, orange);
  background-size: 200% 200%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: gradientMove 5s linear infinite;
  margin: 0;
}

@keyframes gradientMove {
  0% { background-position: 100% 50%; }
  50% { background-position: 0 50%; }
  100% { background-position: 100% 50%; }
}

/* Кнопки */
.btn {
  font-family: sans-serif;
  position: relative;
  font-size: 1rem;
  padding: 10px 20px;
  border: 3px solid black;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  min-width: 120px;
  box-shadow: 0 6px 0 black;
  z-index: 100;
}

.btn:hover {
  transform: scale(1.1);
  border-color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

/* Основной контент */
.main-content {
  padding: 30px;
  background: rgba(0, 0, 0, 0.2);
  min-height: calc(100vh - 80px);
}
</style>