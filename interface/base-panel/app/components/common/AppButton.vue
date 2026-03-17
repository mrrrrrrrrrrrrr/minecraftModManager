<!-- components/common/AppButton.vue -->
<template>
  <button 
    :class="['btn', `btn-${variant}`, { 'btn-sm': size === 'sm', 'btn-large': size === 'lg' }]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value: string) => ['primary', 'success', 'danger', 'warning', 'secondary'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>