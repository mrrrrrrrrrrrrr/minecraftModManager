<!-- components/common/LoadMoreButton.vue -->
<template>
  <div class="load-more-container">
    <button 
      class="load-more-btn"
      :class="{
        'btn-primary': variant === 'primary',
        'btn-secondary': variant === 'secondary',
        'loading': loading
      }"
      :disabled="disabled || loading"
      @click="$emit('click')"
    >
      <span v-if="loading" class="btn-spinner">📦</span>
      <span v-else class="btn-icon">⬇️</span>
      <span class="btn-text">
        <slot>{{ loading ? 'Загрузка...' : 'Загрузить еще' }}</slot>
      </span>
    </button>
    
    <p v-if="showInfo" class="load-more-info">
      Показано {{ loaded }} из {{ total }} модов
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loaded: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value: string) => ['primary', 'secondary'].includes(value)
  },
  showInfo: {
    type: Boolean,
    default: true
  }
})

defineEmits(['click'])
</script>
