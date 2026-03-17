<!-- components/Filters.vue -->
<template>
  <div class="search-filters-container">
    <!-- Хедер поиска -->
    <div class="search-header">
      <div class="search-input-group">
        <!-- Переключатель между сеткой и таблицей -->
        <div class="view-toggle">
          <button 
            class="view-btn grid" 
            :class="{ active: viewMode === 'grid' }" 
            @click="switchView('grid')"
          ></button>
          <button 
            class="view-btn list" 
            :class="{ active: viewMode === 'table' }" 
            @click="switchView('table')"
          ></button>
        </div>

        <!-- Поле поиска -->
        <input 
          type="text" 
          v-model="searchQuery" 
          @input="handleSearchInput"
          placeholder="Поиск модов..." 
          class="search-input"
        />

        <!-- Кнопка открытия/закрытия фильтров -->
        <button 
          id="toggle-filters" 
          class="btn btn-primary" 
          :class="{ 'has-filters': hasActiveFilters }"
          @click="toggleFilters"
        >
          {{ showFiltersPanel ? 'Закрыть' : 'Фильтры' }}
        </button>

        <!-- Кнопка сброса поиска -->
        <button 
          id="clear-search" 
          class="btn btn-secondary btn-sm" 
          :style="{ display: searchQuery ? 'block' : 'none' }"
          @click="clearSearch"
        >
          Сбросить
        </button>
      </div>

      <!-- Информация о результатах поиска -->
      <div id="search-results-info" class="search-results-info">
        {{ resultsInfo }}
      </div>

      <!-- Индикатор загрузки -->
      <div id="search-loading" class="search-loading" :style="{ display: loading ? 'block' : 'none' }">
        Поиск...
      </div>
    </div>

    <!-- Панель фильтров -->
    <div id="filters-panel" class="filters-panel" :style="{ display: showFiltersPanel ? 'block' : 'none' }">
      <div class="filters-grid">
        <!-- Фильтр по версиям -->
        <div class="filter-group">
          <label>Версии игры</label>
          <div id="filter-versions" class="filter-options">
            <div v-if="loadingFilters">Загрузка...</div>
            <label v-for="version in availableVersions" :key="version.id">
              <input 
                type="checkbox" 
                name="version" 
                :value="version.id" 
                v-model="filters.versionIds"
                @change="onFilterChange"
              >
              {{ version.title }}
            </label>
          </div>
        </div>

        <!-- Фильтр по модлоадерам -->
        <div class="filter-group">
          <label>Модлоадеры</label>
          <div id="filter-modloaders" class="filter-options">
            <div v-if="loadingFilters">Загрузка...</div>
            <label v-for="loader in availableModLoaders" :key="loader.id">
              <input 
                type="checkbox" 
                name="modloader" 
                :value="loader.id" 
                v-model="filters.modLoaderIds"
                @change="onFilterChange"
              >
              {{ loader.title }}
            </label>
          </div>
        </div>

        <!-- Фильтр по разработчикам -->
        <div class="filter-group">
          <label>Разработчики</label>
          <div id="filter-developers" class="filter-options">
            <div v-if="loadingFilters">Загрузка...</div>
            <label v-for="dev in availableDevelopers" :key="dev.id">
              <input 
                type="checkbox" 
                name="developer" 
                :value="dev.id" 
                v-model="filters.developers"
                @change="onFilterChange"
              >
              {{ dev.nickname }}
            </label>
          </div>
        </div>

        <!-- Фильтр по тегам -->
        <div class="filter-group">
          <label>Теги</label>
          <div id="filter-tags" class="filter-options">
            <div v-if="loadingFilters">Загрузка...</div>
            <label v-for="tag in availableTags" :key="tag.id">
              <input 
                type="checkbox" 
                name="tag" 
                :value="tag.id" 
                v-model="filters.tagIds"
                @change="onFilterChange"
              >
              {{ tag.title }}
            </label>
          </div>
        </div>

        <!-- Фильтр по типу мода -->
        <div class="filter-group">
          <label>Тип мода</label>
          <div class="filter-options">
            <label>
              <input 
                type="radio" 
                name="mod-type" 
                value="all" 
                :checked="filters.isClientside === undefined"
                @change="filters.isClientside = undefined; onFilterChange()"
              >
              Все
            </label>
            <label>
              <input 
                type="radio" 
                name="mod-type" 
                value="true" 
                :checked="filters.isClientside === true"
                @change="filters.isClientside = true; onFilterChange()"
              >
              Клиентский
            </label>
            <label>
              <input 
                type="radio" 
                name="mod-type" 
                value="false" 
                :checked="filters.isClientside === false"
                @change="filters.isClientside = false; onFilterChange()"
              >
              Серверный
            </label>
          </div>
        </div>

        <!-- Числовые фильтры -->
        <div class="filter-group">
          <label>Минимум скачиваний</label>
          <input 
            type="number" 
            id="min-downloads" 
            min="0" 
            placeholder="0" 
            class="range-input"
            v-model.number="filters.minDownloads"
            @input="debouncedFilterChange"
          >
          
          <label>Максимальный размер (MB)</label>
          <input 
            type="number" 
            id="max-size" 
            min="0" 
            step="0.1" 
            placeholder="Любой" 
            class="range-input"
            v-model.number="filters.maxSize"
            @input="debouncedFilterChange"
          >
        </div>
      </div>

      <!-- Кнопки действий фильтров -->
      <div class="filter-actions">
        <button id="apply-filters" class="btn btn-success" @click="applyFilters">
          Применить
        </button>
        <button id="reset-filters" class="btn btn-danger" @click="resetFilters">
          Сбросить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  viewMode: 'grid' | 'table'
  loading?: boolean
  totalMods?: number
  currentPage?: number
  totalPages?: number
  availableVersions?: any[]
  availableModLoaders?: any[]
  availableTags?: any[]
  availableDevelopers?: any[]
}>()

const emit = defineEmits<{
  (e: 'update:viewMode', value: 'grid' | 'table'): void
  (e: 'update:currentPage', value: number): void
  (e: 'search', params: any): void
  (e: 'load-filters'): void
}>()

// Состояния
const showFiltersPanel = ref(false)
const searchQuery = ref('')
const loadingFilters = ref(false)
const filters = ref({
  search: '',
  versionIds: [] as string[],
  modLoaderIds: [] as string[],
  tagIds: [] as string[],
  developers: [] as string[],
  isClientside: undefined as boolean | undefined,
  minDownloads: 0,
  maxSize: 0
})

// Таймеры для debounce
let searchTimeout: NodeJS.Timeout | null = null
let filterTimeout: NodeJS.Timeout | null = null

// Проверка наличия активных фильтров
const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim() !== '' ||
    filters.value.versionIds.length > 0 ||
    filters.value.modLoaderIds.length > 0 ||
    filters.value.tagIds.length > 0 ||
    filters.value.developers.length > 0 ||
    filters.value.isClientside !== undefined ||
    filters.value.minDownloads > 0 ||
    filters.value.maxSize > 0
  )
})

// Информация о результатах поиска
const resultsInfo = computed(() => {
  if (props.loading) return 'Поиск...'
  if (!props.totalMods && props.totalMods !== 0) return 'Загрузка модов...'
  
  const searchText = searchQuery.value ? ` по запросу "${searchQuery.value}"` : ''
  const pageInfo = props.totalPages && props.totalPages > 1 
    ? ` (стр. ${props.currentPage || 1}/${props.totalPages})` 
    : ''
  
  return `Найдено: ${props.totalMods || 0} модов${searchText}${pageInfo}`
})

// Переключение вида
const switchView = (mode: 'grid' | 'table') => {
  emit('update:viewMode', mode)
}

// Переключение панели фильтров
const toggleFilters = () => {
  showFiltersPanel.value = !showFiltersPanel.value
}

// Обработка ввода поиска
const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value.search = searchQuery.value.trim()
    emit('update:currentPage', 1)
    emit('search', { ...filters.value })
  }, 500)
}

// Очистка поиска
const clearSearch = () => {
  searchQuery.value = ''
  filters.value.search = ''
  emit('update:currentPage', 1)
  emit('search', { ...filters.value })
}

// Изменение фильтра с debounce
const onFilterChange = () => {
  if (filterTimeout) clearTimeout(filterTimeout)
  filterTimeout = setTimeout(() => {
    emit('update:currentPage', 1)
    emit('search', { ...filters.value })
  }, 300)
}

const debouncedFilterChange = () => {
  if (filterTimeout) clearTimeout(filterTimeout)
  filterTimeout = setTimeout(() => {
    emit('update:currentPage', 1)
    emit('search', { ...filters.value })
  }, 500)
}

// Применить фильтры
const applyFilters = () => {
  emit('update:currentPage', 1)
  emit('search', { ...filters.value })
  showFiltersPanel.value = false
}

// Сброс всех фильтров
const resetFilters = () => {
  searchQuery.value = ''
  filters.value = {
    search: '',
    versionIds: [],
    modLoaderIds: [],
    tagIds: [],
    developers: [],
    isClientside: undefined,
    minDownloads: 0,
    maxSize: 0
  }
  emit('update:currentPage', 1)
  emit('search', { ...filters.value })
}

// Загрузка данных для фильтров при монтировании
onMounted(() => {
  emit('load-filters')
})

// Очистка таймеров
onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (filterTimeout) clearTimeout(filterTimeout)
})
</script>