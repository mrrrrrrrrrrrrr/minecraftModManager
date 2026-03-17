<!-- components/mods/ModsTable.vue -->
<template>
  <div class="mods-table">
    <!-- Состояние загрузки -->
    <div v-if="loading" class="mods-table-state">
      <div class="state-spinner">📦</div>
      <p>Загрузка модов...</p>
    </div>

    <!-- Нет результатов -->
    <div v-else-if="!mods.length" class="mods-table-state">
      <div class="state-icon">🔍</div>
      <p>Моды не найдены</p>
    </div>

    <!-- Таблица -->
    <div v-else class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Описание</th>
            <th>Версии</th>
            <th>Модлоадеры</th>
            <th>Теги</th>
            <th>Размер</th>
            <th>Загрузки</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <ModTableRow
            v-for="mod in mods"
            :key="mod.id"
            :mod="mod"
            @view-details="$emit('view-details', mod)"
            @download="$emit('download', mod)"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Mod } from '~/composables/useModsApi'
import ModTableRow from './ModTableRow.vue'

defineProps<{
  mods: Mod[]
  loading?: boolean
}>()

defineEmits<{
  (e: 'view-details', mod: Mod): void
  (e: 'download', mod: Mod): void
}>()
</script>

