<!-- components/common/AppModal.vue -->
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay active" @click.self="close">
      <div class="modal-content" :class="modalClass">
        <div class="modal-header">
          <p>{{ title }}</p>
          <button class="modal-close" @click="close">&times;</button>
        </div>
        
        <div class="modal-body">
          <slot />
        </div>
        
        <div v-if="$slots.footer || showDefaultActions" class="modal-footer">
          <slot name="footer">
            <AppButton variant="secondary" @click="close">Закрыть</AppButton>
            <AppButton v-if="showConfirm" variant="primary" @click="$emit('confirm')">
              {{ confirmText }}
            </AppButton>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppButton from './AppButton.vue'

defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  modalClass: {
    type: String,
    default: ''
  },
  showDefaultActions: {
    type: Boolean,
    default: false
  },
  showConfirm: {
    type: Boolean,
    default: false
  },
  confirmText: {
    type: String,
    default: 'Подтвердить'
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const close = () => {
  emit('update:modelValue', false)
}
</script>