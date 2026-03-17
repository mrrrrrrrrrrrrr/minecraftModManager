<template>
  <div class="animated-background">
    <div 
      v-for="(image, index) in images" 
      :key="index"
      class="bg-layer"
      :style="{ 
        backgroundImage: `url('${image}')`,
        opacity: index === currentIndex ? 1 : 0
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  images: {
    type: Array,
    required: true,
    default: () => []
  },
  interval: {
    type: Number,
    default: 6000
  }
})

const currentIndex = ref(0)
let intervalId: NodeJS.Timeout | null = null

const nextImage = () => {
  // Плавно переходим на следующее изображение
  // Когда доходим до последнего, переходим на первое
  currentIndex.value = (currentIndex.value+2) % props.images.length
}

onMounted(() => {
  if (props.images.length > 1) {
    intervalId = setInterval(nextImage, props.interval)
  }
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>
