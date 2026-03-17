<!-- components/common/Pagination.vue -->
<template>
  <div class="pagination-container" :class="{ 'compact': compact }">
    <div class="pagination-controls">
      <!-- Кнопка "Назад" -->
      <button 
        class="pagination-btn prev"
        :class="{ 'btn-primary': variant === 'primary', 'btn-secondary': variant === 'secondary' }"
        :disabled="currentPage <= 1 || disabled"
        @click="goToPage(currentPage - 1)"
      >
        <span class="btn-icon">←</span>
        <span class="btn-text" v-if="!compact">Назад</span>
      </button>

      <!-- Информация о страницах -->
      <div class="page-info-wrapper">
        <span class="page-info">
          Страница {{ currentPage }} из {{ totalPages }}
        </span>
        
        <!-- Выпадающий список для выбора страницы (только если не compact) -->
        <select 
          v-if="!compact && totalPages > 1"
          class="page-select"
          :value="currentPage"
          @change="goToPage(parseInt(($event.target as HTMLSelectElement).value))"
        >
          <option 
            v-for="page in totalPages" 
            :key="page" 
            :value="page"
          >
            {{ page }}
          </option>
        </select>
      </div>

      <!-- Кнопка "Вперед" -->
      <button 
        class="pagination-btn next"
        :class="{ 'btn-primary': variant === 'primary', 'btn-secondary': variant === 'secondary' }"
        :disabled="currentPage >= totalPages || disabled"
        @click="goToPage(currentPage + 1)"
      >
        <span class="btn-text" v-if="!compact">Вперед</span>
        <span class="btn-icon">→</span>
      </button>
    </div>

    <!-- Дополнительная информация (опционально) -->
    <div v-if="showInfo" class="pagination-info">
      Показано {{ loaded }} из {{ total }} элементов
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    default: 0
  },
  loaded: {
    type: Number,
    default: 0
  },
  disabled: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value: string) => ['primary', 'secondary'].includes(value)
  },
  compact: {
    type: Boolean,
    default: false
  },
  showInfo: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

// Переход на конкретную страницу
const goToPage = (page: number) => {
  if (page < 1 || page > props.totalPages || props.disabled) return
  emit('page-change', page)
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

/* Кнопки пагинации */
.pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  font-family: "Minecraft", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1rem;
  border: 4px solid black;
  box-shadow: 0 6px 0 black;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
  position: relative;
  image-rendering: pixelated;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.5);
}

.pagination-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
  pointer-events: none;
}

.pagination-btn:hover::before {
  left: 100%;
}

.pagination-btn:hover {
  transform: scale(1.05);
  border-color: white;
  z-index: 101;
}

.pagination-btn:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 black;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  transform: none;
  box-shadow: 0 6px 0 black;
}

/* Вариант primary */
.pagination-btn.btn-primary {
  background:
    linear-gradient(0, rgba(0, 255, 255, 1), rgba(0, 0, 0, 0)),
    url('/images/ice.png') center/10vh;
  color: black;
}

.pagination-btn.btn-primary:hover:not(:disabled) {
  background:
    linear-gradient(0, rgba(0, 255, 255, 1), rgba(0, 0, 0, 0.3)),
    url('/images/ice.png') center/10vh;
  color: white;
}

/* Вариант secondary */
.pagination-btn.btn-secondary {
  background:
    linear-gradient(0, rgba(128, 128, 128, 1), rgba(0, 0, 0, 0)),
    url('/images/dead_brain_coral_block.png') center/10vh;
  color: white;
}

.pagination-btn.btn-secondary:hover:not(:disabled) {
  background:
    linear-gradient(0, rgba(128, 128, 128, 1), rgba(0, 0, 0, 0.3)),
    url('/images/dead_brain_coral_block.png') center/10vh;
}

/* Компактный режим */
.pagination-container.compact .pagination-btn {
  padding: 8px 12px;
  min-width: 60px;
  font-size: 0.9rem;
}

.pagination-container.compact .btn-icon {
  font-size: 1.1rem;
}

/* Информация о странице */
.page-info-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-info {
  color: #e0e0e0;
  font-size: 1rem;
  padding: 8px 16px;
  background: #2a2a2a;
  border-radius: 8px;
  border: 1px solid #444;
  font-family: "Minecraft", sans-serif;
  white-space: nowrap;
}

.page-select {
  padding: 8px 12px;
  background: #2a2a2a;
  color: #e0e0e0;
  border: 1px solid #444;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-family: "Minecraft", sans-serif;
}

.page-select:hover {
  border-color: #ff6b6b;
}

.page-select:focus {
  outline: none;
  border-color: #ff6b6b;
}

/* Дополнительная информация */
.pagination-info {
  color: #888;
  font-size: 0.9rem;
  font-family: "Minecraft", sans-serif;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .pagination-controls {
    gap: 10px;
  }
  
  .pagination-btn {
    padding: 8px 16px;
    min-width: 80px;
  }
  
  .page-info {
    font-size: 0.9rem;
    padding: 6px 12px;
  }
  
  .pagination-container.compact .pagination-btn {
    padding: 6px 10px;
    min-width: 50px;
  }
}

@media (max-width: 480px) {
  .pagination-controls {
    flex-direction: column;
    width: 100%;
  }
  
  .pagination-btn {
    width: 100%;
  }
  
  .page-info-wrapper {
    width: 100%;
    justify-content: center;
  }
}
</style>