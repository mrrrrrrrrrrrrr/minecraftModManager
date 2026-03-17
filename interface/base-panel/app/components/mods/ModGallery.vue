<!-- components/mods/ModGallery.vue -->
<template>
  <div v-if="images.length" class="mod-gallery-carousel">
    <div class="carousel-container" @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay">
      <button 
        class="carousel-btn carousel-prev" 
        @click="prev"
        :disabled="!hasPrev"
      >❮</button>
      
      <div class="carousel-track">
        <div 
          v-for="(image, index) in visibleImages" 
          :key="image.id"
          class="carousel-slide"
          :class="{
            'carousel-active-slide': index === 1,
            'carousel-prev-slide': index === 0,
            'carousel-next-slide': index === 2
          }"
        >
          <img 
            :src="getImageUrl(image.imageUrl)" 
            :alt="image.fileName"
            class="carousel-image"
            @click="openFullscreen(image)"
            @error="handleImageError"
          />
        </div>
      </div>
      
      <button 
        class="carousel-btn carousel-next" 
        @click="next"
        :disabled="!hasNext"
      >❯</button>
      
      <div class="carousel-dots">
        <button 
          v-for="(_, index) in images" 
          :key="index"
          class="carousel-dot"
          :class="{ active: index === currentIndex }"
          @click="goTo(index)"
        />
      </div>
    </div>
  </div>

  <!-- Модалка для полноэкранного просмотра -->
  <AppModal
    v-model="fullscreen"
    :title="currentImage?.fileName || 'Изображение'"
    modal-class="gallery-modal"
    :show-default-actions="false"
  >
    <div class="gallery-fullscreen">
      <img 
        :src="getImageUrl(currentImage?.imageUrl)" 
        :alt="currentImage?.fileName"
        class="gallery-fullscreen-image"
      />
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import type { ModGalleryImage } from '~/composables/useModsApi'
import AppModal from '../common/AppModal.vue'

const props = defineProps<{
  images: ModGalleryImage[]
}>()

const { getImageUrl } = useModsApi()

const currentIndex = ref(0)
const fullscreen = ref(false)
const currentImage = ref<ModGalleryImage | null>(null)

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < props.images.length - 1)

// Получаем три видимых изображения (предыдущее, текущее, следующее)
const visibleImages = computed(() => {
  if (!props.images.length) return []
  
  const prev = (currentIndex.value - 1 + props.images.length) % props.images.length
  const next = (currentIndex.value + 1) % props.images.length
  
  return [
    props.images[prev],
    props.images[currentIndex.value],
    props.images[next]
  ]
})

const next = () => {
  if (hasNext.value) {
    currentIndex.value++
  }
}

const prev = () => {
  if (hasPrev.value) {
    currentIndex.value--
  }
}

const goTo = (index: number) => {
  currentIndex.value = index
}

const openFullscreen = (image: ModGalleryImage) => {
  currentImage.value = image
  fullscreen.value = true
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

// Автопрокрутка
let interval: NodeJS.Timeout | null = null

const startAutoPlay = () => {
  if (props.images.length <= 1) return
  interval = setInterval(() => {
    if (hasNext.value) {
      next()
    } else {
      goTo(0)
    }
  }, 3000)
}

const stopAutoPlay = () => {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>