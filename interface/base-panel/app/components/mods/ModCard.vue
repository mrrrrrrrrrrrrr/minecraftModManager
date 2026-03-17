<!-- components/mods/ModCard.vue -->
<template>
  <div class="mod-card">
    <!-- Верхняя часть с изображением и типом -->
    <div class="mod-card-header">
      <div class="mod-card-image-wrapper">
        <img 
          v-if="mod.imageUrl" 
          :src="getImageUrl(mod.imageUrl)" 
          :alt="mod.title"
          class="mod-card-image"
          @error="handleImageError"
        />
        <div v-else class="mod-card-image-placeholder">
          📦
        </div>
      </div>
      
      <div class="mod-card-type" :class="{ 'client': mod.isClientside, 'server': !mod.isClientside }">
        {{ mod.isClientside ? 'Клиент' : 'Сервер' }}
      </div>
    </div>

    <!-- Контент карточки -->
    <div class="mod-card-content">
      <h3 class="mod-card-title" :title="mod.title">
        {{ mod.title }}
      </h3>

      <p class="mod-card-description" v-if="mod.description">
        {{ truncateDescription(mod.description) }}
      </p>

      <!-- Статистика -->
      <div class="mod-card-stats">
        <div class="mod-card-stat" title="Загрузки">
          <span class="stat-icon">⬇️</span>
          <span>{{ formatNumber(mod.downloads || 0) }}</span>
        </div>
        <div class="mod-card-stat" title="Размер">
          <span class="stat-icon">💾</span>
          <span>{{ mod.size || 0 }} MB</span>
        </div>
      </div>

      <!-- Теги (если есть) -->
      <div v-if="mod.tags?.length" class="mod-card-tags">
        <span 
          v-for="tag in mod.tags.slice(0, 3)" 
          :key="tag.id"
          class="mod-card-tag"
          :title="tag.title"
        >
          {{ tag.title }}
        </span>
        <span v-if="mod.tags.length > 3" class="mod-card-tag more">
          +{{ mod.tags.length - 3 }}
        </span>
      </div>

      <!-- Кнопка -->
      <button 
        class="mod-card-button"
        @click="$emit('view-details', mod)"
      >
        Подробнее
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Mod } from '~/composables/useModsApi'

const props = defineProps<{
  mod: Mod
}>()

const emit = defineEmits<{
  (e: 'view-details', mod: Mod): void
}>()

const { getImageUrl } = useModsApi()

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const truncateDescription = (text: string): string => {
  if (text.length <= 100) return text
  return text.substring(0, 100) + '...'
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  img.parentElement?.classList.add('image-error')
}
</script>

