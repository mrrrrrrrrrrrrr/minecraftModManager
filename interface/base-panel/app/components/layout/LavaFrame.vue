<template>
  <div class="lava-frame">
    <!-- Лавовые потоки -->
    <div class="lava-flow lava-left"></div>
    <div class="lava-flow lava-right"></div>
    
    <!-- Затемнение по краям для плавности -->
    <div class="lava-overlay lava-overlay-left"></div>
    <div class="lava-overlay lava-overlay-right"></div>
    
    <!-- Контент -->
    <div class="lava-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// Можно добавить пропсы для настройки
defineProps({
  lavaWidth: {
    type: Number,
    default: 250 // Ширина лавы в пикселях (увеличил с 200 до 250)
  },
  overlayOpacity: {
    type: Number,
    default: 0.7 // Прозрачность затемнения
  }
})
</script>

