<template>
  <div class="app-container">
    <AnimatedBackground :images="backgroundImages" />
    <CustomCursor />
    <header class="header">
      <div class="header-content">
        <div class="logo-image"></div>
        <h1 class="logo">Lava Mods Manager</h1>
      </div>
    </header>
    
    <main class="main-content">
      <LavaFrame>  <!-- Оборачиваем контент в лавовый фрейм -->
        <NuxtPage />
      </LavaFrame>
    </main>
  </div>
</template>

<script setup>
import CustomCursor from '~/components/common/CustomCursor.vue'
import AnimatedBackground from '~/components/common/AnimatedBackground.vue'
import LavaFrame from '~/components/layout/LavaFrame.vue'

const backgroundImages = [
  '/images/background1.webp',
  '/images/background2.webp',
  '/images/background3.webp',
  '/images/background4.webp',
  '/images/background5.webp'
]
</script>