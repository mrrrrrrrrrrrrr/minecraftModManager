<!-- components/mods/ModsGrid.vue -->
<template>
  <div class="mods-grid">
    <!-- Состояние загрузки -->
    <div v-if="loading" class="mods-grid-state">
      <div class="state-spinner">📦</div>
      <p>Загрузка модов...</p>
    </div>

    <!-- Нет результатов -->
    <div v-else-if="!mods.length" class="mods-grid-state">
      <div class="state-icon">🔍</div>
      <p>Моды не найдены</p>
    </div>

    <!-- Сетка с модами -->
    <div v-else class="mods-grid-container">
      <ModCard
        v-for="mod in mods"
        :key="mod.id"
        :mod="mod"
        @view-details="$emit('view-details', mod)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Mod } from '~/composables/useModsApi'
import ModCard from './ModCard.vue'

defineProps<{
  mods: Mod[]
  loading?: boolean
}>()

defineEmits<{
  (e: 'view-details', mod: Mod): void
}>()
</script>

