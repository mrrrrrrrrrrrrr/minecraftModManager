<!-- pages/index.vue -->
<template>
  <div class="tabs-content">
    <!-- Компонент поиска и фильтрации -->
    <Filters
      v-model:viewMode="viewMode"
      v-model:currentPage="currentPage"
      :loading="loading"
      :totalMods="totalCount"
      :totalPages="totalPages"
      :availableVersions="availableVersions"
      :availableModLoaders="availableModLoaders"
      :availableTags="availableTags"
      :availableDevelopers="availableDevelopers"
      @load-filters="loadFilterData"
      @search="handleSearch"
    />
    
    <!-- Верхняя пагинация -->
    <div v-if="totalPages > 1 && navMode === 'pagination'" class="pagination-top">
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total="totalCount"
        :loaded="allMods.length"
        :disabled="loading || loadingMore"
        variant="secondary"
        compact
        @page-change="goToPage"
      />
    </div>
    
    <!-- Индикатор загрузки при первом входе -->
    <div v-if="loading && !hasMore" class="mods-loading">
      <div class="loading-spinner">📦</div>
      <p>Загрузка модов...</p>
    </div>
    
    <!-- Сообщение об ошибке -->
    <div v-else-if="error" class="mods-loading">
      <div class="loading-spinner">❌</div>
      <p>{{ error }}</p>
      <AppButton variant="primary" @click="resetAndLoad">Повторить</AppButton>
    </div>
    
    <!-- Сетка/таблица с модами -->
    <template v-else>
      <!-- Сетка -->
      <ModsGrid
        v-if="viewMode === 'grid' && allMods.length"
        :mods="allMods"
        :loading="false"
        @view-details="openDetails"
      />
      
      <!-- Таблица -->
      <ModsTable
        v-else-if="viewMode === 'table' && allMods.length"
        :mods="allMods"
        :loading="false"
        @view-details="openDetails"
        @download="openDownload"
      />
      
      <!-- Нет результатов -->
      <div v-else-if="!loading" class="mods-loading">
        <div class="loading-spinner">🔍</div>
        <p>Моды не найдены</p>
      </div>
    </template>

    <!-- Панель управления навигацией (нижняя) -->
    <div v-if="totalPages > 1" class="navigation-panel">
      <!-- Переключатель режима -->
      <div class="nav-mode-toggle">
        <button 
          class="nav-mode-btn" 
          :class="{ active: navMode === 'pagination' }"
          @click="switchNavMode('pagination')"
        >
          📄 По страницам
        </button>
        <button 
          class="nav-mode-btn" 
          :class="{ active: navMode === 'infinite' }"
          @click="switchNavMode('infinite')"
        >
          🔄 Бесконечная лента
        </button>
      </div>

      <!-- Пагинация (постраничная навигация) - нижняя -->
      <Pagination
        v-if="navMode === 'pagination' && totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total="totalCount"
        :loaded="allMods.length"
        :disabled="loading || loadingMore"
        variant="primary"
        :show-info="true"
        @page-change="goToPage"
      />

      <!-- Кнопка "Загрузить еще" (бесконечная лента) -->
      <LoadMoreButton
        v-if="navMode === 'infinite' && hasMore"
        :loading="loadingMore"
        :loaded="allMods.length"
        :total="totalCount"
        variant="primary"
        @click="loadMore"
      />
    </div>

    <!-- Информация о текущем режиме (для бесконечной ленты) -->
    <div v-if="navMode === 'infinite' && allMods.length > 0" class="infinite-info">
      Показано {{ allMods.length }} из {{ totalCount }} модов
      <span v-if="!hasMore" class="all-loaded">(все загружены)</span>
    </div>
  </div>

  <!-- Модальные окна -->
  <ModDetails
    v-if="selectedMod"
    v-model="showDetails"
    :mod="selectedMod"
    :gallery="modGallery"
    @download="openDownload"
  />

  <DownloadModal
    v-if="selectedMod"
    v-model="showDownload"
    :mod="selectedMod"
  />
</template>

<script setup lang="ts">
import type { Mod, ModGalleryImage } from '~/composables/modsApi'
import Filters from '~/components/common/Filters.vue'
import Pagination from '~/components/common/Pagination.vue'
import ModsViewToggle from '~/components/mods/ModsViewToggle.vue'
import ModsGrid from '~/components/mods/ModsGrid.vue'
import LoadMoreButton from '~/components/common/LoadMoreButton.vue'
import ModsTable from '~/components/mods/ModsTable.vue'
import ModDetails from '~/components/mods/ModDetails.vue'
import DownloadModal from '~/components/mods/DownloadModal.vue'
import AppButton from '~/components/common/AppButton.vue'
import { referencesApi, modsApi, galleriesApi } from '~/composables/modsApi'

// Основные состояния
const viewMode = ref<'grid' | 'table'>('grid')
const navMode = ref<'pagination' | 'infinite'>('pagination') // Режим навигации
const allMods = ref<Mod[]>([]) // Все загруженные моды
const loading = ref(true) // Первоначальная загрузка
const loadingMore = ref(false) // Загрузка дополнительных
const error = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = ref(12)
const totalPages = ref(1)
const totalCount = ref(0)
const showDetails = ref(false)
const showDownload = ref(false)
const selectedMod = ref<Mod | null>(null)
const modGallery = ref<ModGalleryImage[]>([])

// Данные для фильтров
const availableVersions = ref<any[]>([])
const availableModLoaders = ref<any[]>([])
const availableTags = ref<any[]>([])
const availableDevelopers = ref<any[]>([])

// Текущие фильтры для поиска
const currentFilters = ref({
  search: '',
  versionIds: [] as string[],
  modLoaderIds: [] as string[],
  tagIds: [] as string[],
  developers: [] as string[],
  isClientside: undefined as boolean | undefined,
  minDownloads: 0,
  maxSize: 0
})

// Вычисляем, есть ли еще моды для загрузки (для бесконечной ленты)
const hasMore = computed(() => {
  return !loading.value && allMods.value.length < totalCount.value
})

// Загрузка данных для фильтров
const loadFilterData = async () => {
  try {
    const [versions, loaders, tags, devs] = await Promise.all([
      referencesApi.getVersions(),
      referencesApi.getModLoaders(),
      referencesApi.getTags(),
      referencesApi.getDevelopers()
    ])
    
    availableVersions.value = versions || []
    availableModLoaders.value = loaders || []
    availableTags.value = tags || []
    availableDevelopers.value = devs || []
  } catch (err) {
    console.error('Ошибка загрузки фильтров:', err)
  }
  
  // После загрузки фильтров загружаем моды
  await loadMods(true)
}

// Загрузка модов
const loadMods = async (reset = false) => {
  if (reset) {
    loading.value = true
    allMods.value = []
    // НЕ сбрасываем currentPage здесь - он уже установлен в вызывающей функции
  } else {
    loadingMore.value = true
  }
  
  error.value = null
  
  try {
    // Формируем параметры запроса
    const params = {
      pageNumber: currentPage.value, // Используем актуальный currentPage
      pageSize: pageSize.value,
      sortBy: 'CreatedAt',
      orderBy: 'desc',
      search: currentFilters.value.search || undefined,
      isClientside: currentFilters.value.isClientside,
      minDownloads: currentFilters.value.minDownloads > 0 ? currentFilters.value.minDownloads : undefined,
      maxSize: currentFilters.value.maxSize > 0 ? currentFilters.value.maxSize : undefined,
      versionIds: currentFilters.value.versionIds.length ? currentFilters.value.versionIds : undefined,
      modLoaderIds: currentFilters.value.modLoaderIds.length ? currentFilters.value.modLoaderIds : undefined,
      tagIds: currentFilters.value.tagIds.length ? currentFilters.value.tagIds : undefined,
      developers: currentFilters.value.developers.length ? currentFilters.value.developers : undefined
    }
    
    // Очищаем undefined значения
    Object.keys(params).forEach(key => 
      params[key] === undefined && delete params[key]
    )
    
    console.log('📡 Загрузка страницы:', params.pageNumber)
    const response = await modsApi.search(params)
    
    if (reset) {
      allMods.value = response.items || []
    } else {
      // Добавляем новые моды к существующим (для бесконечной ленты)
      allMods.value = [...allMods.value, ...(response.items || [])]
    }
    
    totalCount.value = response.totalCount || 0
    totalPages.value = Math.ceil(totalCount.value / pageSize.value) || 1
    
    console.log(`✅ Загружено модов: ${allMods.value.length}, всего: ${totalCount.value}`)
  } catch (err: any) {
    console.error('Ошибка загрузки модов:', err)
    error.value = err.message || 'Не удалось загрузить моды'
    if (reset) allMods.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Переключение режима навигации
const switchNavMode = (mode: 'pagination' | 'infinite') => {
  navMode.value = mode
  
  // Если переключаемся на пагинацию, но текущая страница не первая,
  // загружаем соответствующую страницу
  if (mode === 'pagination' && currentPage.value > 1) {
    loadMods(true)
  }
  
  // Если переключаемся на бесконечную ленту, сбрасываем на первую страницу
  if (mode === 'infinite') {
    currentPage.value = 1
    loadMods(true)
  }
}

// Переход на конкретную страницу (для пагинации)
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  
  // Обновляем currentPage
  currentPage.value = page
  
  // Загружаем моды для новой страницы (сбрасывая список)
  loadMods(true)
}

// Загрузить еще модов (для бесконечной ленты)
const loadMore = () => {
  if (hasMore.value && !loadingMore.value) {
    currentPage.value++
    loadMods(false) // false = добавить к существующим
  }
}

// Сброс и загрузка заново (после ошибки)
const resetAndLoad = () => {
  currentPage.value = 1
  loadMods(true)
}

// Обработка поиска из компонента Filters
const handleSearch = (filters: any) => {
  currentFilters.value = { ...filters }
  currentPage.value = 1
  loadMods(true)
}

const openDetails = async (mod: Mod) => {
  selectedMod.value = mod
  showDetails.value = true
  
  try {
    modGallery.value = await galleriesApi.getByModId(mod.id)
  } catch (error) {
    console.error('Ошибка загрузки галереи:', error)
    modGallery.value = []
  }
}

const openDownload = (mod: Mod) => {
  selectedMod.value = mod
  showDownload.value = true
}

onMounted(() => {
  loadFilterData()
})
</script>

<style scoped>
.tabs-content {
  width: 100%;
}

.mods-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
  border-radius: 16px;
  border: 2px solid #333;
  text-align: center;
  color: #b0b0b0;
  margin: 20px 0;
}

.loading-spinner {
  font-size: 3rem;
  animation: spin 2s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Верхняя пагинация */
.pagination-top {
  margin: 20px 0;
  display: flex;
  justify-content: center;
}

/* Панель навигации */
.navigation-panel {
  margin: 30px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* Переключатель режимов */
.nav-mode-toggle {
  display: flex;
  gap: 10px;
  background: #2a2a2a;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid #444;
}

.nav-mode-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #b0b0b0;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-mode-btn:hover {
  background: #333;
  color: #e0e0e0;
}

.nav-mode-btn.active {
  background: #ff6b6b;
  color: white;
}

/* Информация для бесконечной ленты */
.infinite-info {
  text-align: center;
  color: #888;
  font-size: 0.9rem;
  margin-top: -15px;
  margin-bottom: 20px;
}

.all-loaded {
  color: #4ecdc4;
  margin-left: 8px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .nav-mode-toggle {
    width: 100%;
  }
  
  .nav-mode-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>