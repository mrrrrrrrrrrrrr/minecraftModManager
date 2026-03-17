<!-- components/mods/ModTableRow.vue -->
<template>
  <tr class="table-row">
    <td class="title-cell">
      <div class="title-content">
        <span class="title" :title="mod.title">{{ mod.title }}</span>
        <span class="badge" :class="{ 'client': mod.isClientside, 'server': !mod.isClientside }" :title="mod.isClientside ? 'Клиентский' : 'Серверный'">
          {{ mod.isClientside ? '🎮' : '🖥️' }}
        </span>
      </div>
    </td>
    
    <td class="description-cell">
      <span class="description" :title="mod.description || ''">
        {{ mod.description || '—' }}
      </span>
    </td>
    
    <td class="versions-cell">
      <div class="tags-list">
        <span v-for="version in mod.versions?.slice(0, 2)" :key="version.id" class="tag" :title="version.title">
          {{ version.title }}
        </span>
        <span v-if="mod.versions?.length > 2" class="tag more" :title="`Еще ${mod.versions.length - 2}`">
          +{{ mod.versions.length - 2 }}
        </span>
        <span v-if="!mod.versions?.length" class="no-data">—</span>
      </div>
    </td>
    
    <td class="loaders-cell">
      <div class="tags-list">
        <span v-for="loader in mod.modLoaders?.slice(0, 2)" :key="loader.id" class="tag" :title="loader.title">
          {{ loader.title }}
        </span>
        <span v-if="mod.modLoaders?.length > 2" class="tag more" :title="`Еще ${mod.modLoaders.length - 2}`">
          +{{ mod.modLoaders.length - 2 }}
        </span>
        <span v-if="!mod.modLoaders?.length" class="no-data">—</span>
      </div>
    </td>
    
    <td class="tags-cell">
      <div class="tags-list">
        <span v-for="tag in mod.tags?.slice(0, 2)" :key="tag.id" class="tag" :title="tag.title">
          {{ tag.title }}
        </span>
        <span v-if="mod.tags?.length > 2" class="tag more" :title="`Еще ${mod.tags.length - 2}`">
          +{{ mod.tags.length - 2 }}
        </span>
        <span v-if="!mod.tags?.length" class="no-data">—</span>
      </div>
    </td>
    
    <td class="size-cell">
      <span :title="`${mod.size || 0} MB`">{{ mod.size || 0 }} MB</span>
    </td>
    
    <td class="downloads-cell">
      <span class="downloads-count" :title="`${mod.downloads || 0} загрузок`">{{ formatNumber(mod.downloads || 0) }}</span>
    </td>
    
    <td class="actions-cell">
      <button 
        class="action-btn download"
        @click="$emit('download', mod)"
        title="Скачать"
      >
        ⬇️
      </button>
      <button 
        class="action-btn view"
        @click="$emit('view-details', mod)"
        title="Подробнее"
      >
        👁️
      </button>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { Mod } from '~/composables/useModsApi'

defineProps<{
  mod: Mod
}>()

defineEmits<{
  (e: 'view-details', mod: Mod): void
  (e: 'download', mod: Mod): void
}>()

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
</script>

