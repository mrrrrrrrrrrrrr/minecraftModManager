<!-- components/mods/ModsViewToggle.vue -->
<template>
  <div class="view-toggle">
    <button 
      class="view-btn grid" 
      :class="{ active: modelValue === 'grid' }"
      @click="$emit('update:modelValue', 'grid')"
      title="Сетка"
    ></button>
    <button 
      class="view-btn list" 
      :class="{ active: modelValue === 'table' }"
      @click="$emit('update:modelValue', 'table')"
      title="Таблица"
    ></button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: 'grid' | 'table'
}>()

defineEmits<{
  (e: 'update:modelValue', value: 'grid' | 'table'): void
}>()
</script>