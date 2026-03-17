<!-- components/mods/ModDetails.vue -->
<template>
  <AppModal
    v-model="show"
    title="Детали мода"
    modal-class="modal-mod-details"
    :show-default-actions="false"
  >
    <div class="mod-details-content">
      <!-- Шапка с изображением и основной информацией -->
      <div class="mod-details-header">
        <div class="mod-details-image">
          <img 
            v-if="mod.imageUrl" 
            :src="getImageUrl(mod.imageUrl)" 
            :alt="escapeHtml(mod.title)"
            @error="handleImageError"
          />
          <span v-else>📦</span>
        </div>
        
        <div>
          <h2 class="mod-details-title">{{ escapeHtml(mod.title) }}</h2>
          
          <div v-if="mainDeveloper" class="mod-details-developer">
            от {{ escapeHtml(mainDeveloper.nickname) }}
          </div>
          
          <div class="mod-details-description-container">
            <p class="mod-details-description">
              {{ escapeHtml(mod.description) || 'Описание отсутствует' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Статистика в виде карточек -->
      <div class="mod-details-grid">
        <div class="mod-details-stat">
          <div class="mod-details-stat-value">{{ formatNumber(mod.downloads || 0) }}</div>
          <div class="mod-details-stat-label">Скачивания</div>
        </div>
        <div class="mod-details-stat">
          <div class="mod-details-stat-value">{{ mod.size || 0 }} MB</div>
          <div class="mod-details-stat-label">Размер</div>
        </div>
        <div class="mod-details-stat">
          <div class="mod-details-stat-value">{{ mod.isClientside ? '🎮' : '🖥️' }}</div>
          <div class="mod-details-stat-label">Тип</div>
        </div>
        <div class="mod-details-stat">
          <div class="mod-details-stat-value">{{ formatDate(mod.updatedAt) }}</div>
          <div class="mod-details-stat-label">Обновлено</div>
        </div>
      </div>

      <!-- Секции с тегами, версиями, модлоадерами -->
      <div class="mod-details-sections">
        <!-- Версии -->
        <div v-if="mod.versions?.length" class="mod-details-section">
          <h3 class="mod-details-section-title">Совместимые версии</h3>
          <div class="mod-details-versions-container">
            <span 
              v-for="version in mod.versions" 
              :key="version.id"
              class="mod-details-version"
            >
              {{ escapeHtml(version.title) }}
            </span>
          </div>
        </div>

        <!-- Модлоадеры -->
        <div v-if="mod.modLoaders?.length" class="mod-details-section">
          <h3 class="mod-details-section-title">Модлоадеры</h3>
          <div class="mod-details-loaders-container">
            <span 
              v-for="loader in mod.modLoaders" 
              :key="loader.id"
              class="mod-details-loader"
            >
              {{ escapeHtml(loader.title) }}
            </span>
          </div>
        </div>

        <!-- Теги -->
        <div v-if="mod.tags?.length" class="mod-details-section">
          <h3 class="mod-details-section-title">Теги</h3>
          <div class="mod-details-tags-container">
            <span 
              v-for="tag in mod.tags" 
              :key="tag.id"
              class="mod-details-tag"
            >
              {{ escapeHtml(tag.title) }}
            </span>
          </div>
        </div>

        <!-- Дополнительные разработчики -->
        <div v-if="mod.developers?.length > 1" class="mod-details-section">
          <h3 class="mod-details-section-title">Разработчики</h3>
          <div class="mod-details-tags-container">
            <span 
              v-for="dev in mod.developers.slice(1)" 
              :key="dev.id"
              class="mod-details-tag"
            >
              {{ escapeHtml(dev.nickname) }}
            </span>
          </div>
        </div>

        <!-- Галерея изображений -->
        <div v-if="gallery && gallery.length" class="mod-details-section">
          <h3 class="mod-details-section-title">📷 Галерея</h3>
          <ModGallery :images="gallery" />
        </div>
      </div>

      <!-- Кнопки действий -->
      <div class="mod-details-actions">
        <AppButton variant="secondary" @click="close">Закрыть</AppButton>
        <AppButton variant="primary" @click="$emit('download', mod)">
          ⬇️ Скачать мод
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import type { Mod, ModGalleryImage } from '~/composables/useModsApi'
import AppModal from '../common/AppModal.vue'
import AppButton from '../common/AppButton.vue'
import ModGallery from './ModGallery.vue'

const props = defineProps<{
  modelValue: boolean
  mod: Mod
  gallery?: ModGalleryImage[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'download', mod: Mod): void
}>()

const { getImageUrl } = useModsApi()

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const mainDeveloper = computed(() => 
  props.mod.developers && props.mod.developers.length > 0 
    ? props.mod.developers[0] 
    : null
)

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'тыс.'
  return num.toString()
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

const escapeHtml = (text?: string): string => {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

const close = () => {
  show.value = false
}
</script>
