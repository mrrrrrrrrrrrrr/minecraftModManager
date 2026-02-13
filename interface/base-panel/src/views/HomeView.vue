<template>
  <div class="home-view">
    <!-- Навигация между гридом и таблицей -->
    <nav class="tabs-nav">
      <button class="tab-btn active" @click="switchView('grid')">Сетка</button>
      <button class="tab-btn" @click="switchView('table')">Таблица</button>
    </nav>

    <!-- ========== ПОИСК И ФИЛЬТРЫ ИЗ АДМИН-ПАНЕЛИ ========== -->
    <div class="search-filters-container">
      <div class="search-header">
        <div class="search-input-group">
          <!-- Переключение вида -->
          <div class="view-toggle">
            <button 
              class="view-btn grid" 
              :class="{ active: viewMode === 'grid' }" 
              @click="switchView('grid')"
              title="Сетка"
            >
              ⏹️
            </button>
            <button 
              class="view-btn list" 
              :class="{ active: viewMode === 'list' }" 
              @click="switchView('list')"
              title="Список"
            >
              📋
            </button>
          </div>

          <!-- Поле поиска -->
          <input 
            v-model="searchQuery" 
            @input="handleSearchInput" 
            placeholder="Поиск модов..." 
            class="search-input" 
          />

          <!-- Кнопка фильтров -->
          <button 
            @click="toggleFilters" 
            class="btn-toggle-filters" 
            :class="{ active: showFiltersPanel }"
          >
            {{ showFiltersPanel ? 'Закрыть фильтры' : 'Фильтры' }}
          </button>

          <!-- Сброс фильтров -->
          <button 
            v-if="hasActiveFilters" 
            @click="resetFilters" 
            class="btn-reset-filters"
          >
            Сбросить
          </button>
        </div>

        <!-- Информация о результатах -->
        <div class="search-results-info">
          {{ getResultsInfo() }}
        </div>

        <!-- Индикатор загрузки поиска -->
        <div v-if="searchLoading" class="search-loading">
          🔍 Поиск...
        </div>
      </div>

      <!-- ========== ПАНЕЛЬ ФИЛЬТРОВ ИЗ АДМИН-ПАНЕЛИ ========== -->
      <div v-if="showFiltersPanel" class="filters-panel">
        <div class="filters-grid">
          <!-- Версии Minecraft -->
          <div class="filter-group">
            <label>Версии Minecraft</label>
            <div class="filter-options">
              <div v-if="loadingFilterData" class="filter-loading">Загрузка...</div>
              <label v-for="version in availableVersions" :key="version.id">
                <input 
                  type="checkbox" 
                  :value="version.id" 
                  v-model="filters.versionIds" 
                  @change="applyFilters" 
                />
                {{ version.title }}
              </label>
            </div>
          </div>

          <!-- Загрузчики модов -->
          <div class="filter-group">
            <label>Загрузчики модов</label>
            <div class="filter-options">
              <div v-if="loadingFilterData" class="filter-loading">Загрузка...</div>
              <label v-for="loader in availableModLoaders" :key="loader.id">
                <input 
                  type="checkbox" 
                  :value="loader.id" 
                  v-model="filters.modLoaderIds" 
                  @change="applyFilters" 
                />
                {{ loader.title }}
              </label>
            </div>
          </div>

          <!-- Теги -->
          <div class="filter-group">
            <label>Теги</label>
            <div class="filter-options">
              <div v-if="loadingFilterData" class="filter-loading">Загрузка...</div>
              <label v-for="tag in availableTags" :key="tag.id">
                <input 
                  type="checkbox" 
                  :value="tag.id" 
                  v-model="filters.tagIds" 
                  @change="applyFilters" 
                />
                {{ tag.title }}
              </label>
            </div>
          </div>

          <!-- Разработчики -->
          <div class="filter-group">
            <label>Разработчики</label>
            <div class="filter-options">
              <div v-if="loadingFilterData" class="filter-loading">Загрузка...</div>
              <label v-for="developer in availableDevelopers" :key="developer.id">
                <input 
                  type="checkbox" 
                  :value="developer.id" 
                  v-model="filters.developers" 
                  @change="applyFilters" 
                />
                {{ developer.nickname }}
              </label>
            </div>
          </div>

          <!-- Тип мода -->
          <div class="filter-group">
            <label>Тип мода</label>
            <div class="filter-options">
              <label>
                <input 
                  type="radio" 
                  name="mod-type" 
                  :value="undefined" 
                  v-model="filters.isClientside" 
                  @change="applyFilters" 
                />
                Все
              </label>
              <label>
                <input 
                  type="radio" 
                  name="mod-type" 
                  :value="true" 
                  v-model="filters.isClientside" 
                  @change="applyFilters" 
                />
                Клиентский
              </label>
              <label>
                <input 
                  type="radio" 
                  name="mod-type" 
                  :value="false" 
                  v-model="filters.isClientside" 
                  @change="applyFilters" 
                />
                Серверный
              </label>
            </div>
          </div>

          <!-- Числовые фильтры -->
          <div class="filter-group">
            <label>Минимум скачиваний</label>
            <input 
              type="number" 
              v-model.number="filters.minDownloads" 
              min="0" 
              @input="debouncedApplyFilters" 
              class="range-input" 
              placeholder="0" 
            />

            <label>Максимальный размер (MB)</label>
            <input 
              type="number" 
              v-model.number="filters.maxSize" 
              min="0" 
              step="0.1" 
              @input="debouncedApplyFilters" 
              class="range-input" 
              placeholder="Любой" 
            />
          </div>
        </div>

        <!-- Кнопки действий фильтров -->
        <div class="filter-actions">
          <button @click="applyFilters" class="btn-apply-filters">
            Применить фильтры
          </button>
          <button @click="resetFilters" class="btn-reset-all">
            Сбросить всё
          </button>
        </div>
      </div>

      <!-- Пагинация -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1" 
          class="page-btn"
        >
          ← Назад
        </button>

        <span class="page-info">
          Страница {{ currentPage }} из {{ totalPages }}
        </span>

        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages" 
          class="page-btn"
        >
          Вперед →
        </button>
      </div>
    </div>

    <!-- ========== ГРИД МОДОВ В MINECRAFT-СТИЛЕ ========== -->
    <div v-if="viewMode === 'grid' && mods.length > 0" class="mods-grid">
      <div class="mods-grid-container">
        <div 
          v-for="mod in sortedMods" 
          :key="mod.id" 
          class="mod-card"
          @click="viewModDetails(mod)"
        >
          <!-- Верхняя часть карточки -->
          <div class="card-header">
            <div class="card-avatar">
              <img 
                v-if="mod.imageUrl" 
                :src="getFullImageUrl(mod.imageUrl)" 
                :alt="mod.title"
                @error="handleImageError" 
              />
              <div v-else class="no-avatar">🖼️</div>
            </div>

            <div class="card-title">
              <h3 class="mod-title">{{ mod.title || 'Без названия' }}</h3>
              <div class="card-stats">
                <span class="downloads">📥 {{ formatNumber(mod.downloads) }}</span>
                <span class="size">💾 {{ mod.size || '0' }} MB</span>
              </div>
            </div>
          </div>

          <!-- Описание -->
          <div class="card-description">
            {{ truncateDescription(mod.description) }}
          </div>

          <!-- Теги и версии -->
          <div class="card-tags">
            <span 
              v-for="version in (mod.versions || []).slice(0, 2)" 
              :key="version.id" 
              class="tag version-tag"
            >
              {{ version.title }}
            </span>
            <span 
              v-for="loader in (mod.modLoaders || []).slice(0, 1)" 
              :key="loader.id" 
              class="tag loader-tag"
            >
              {{ loader.title }}
            </span>
            <span v-if="mod.isClientside" class="tag clientside-tag">
              Клиентский
            </span>

            <!-- Разработчики -->
            <span 
              v-for="developer in (mod.developers || []).slice(0, 1)" 
              :key="developer.id" 
              class="tag developer-tag"
            >
              👨‍💻 {{ developer.nickname }}
            </span>
          </div>

          <!-- Действия (ТОЛЬКО просмотр) -->
          <div class="card-actions">
            <button @click="viewModDetails(mod)" class="btn-view" title="Подробнее">
              👁️ Подробно
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== ТАБЛИЦА МОДОВ В NETHER-СТИЛЕ ========== -->
    <div v-if="viewMode === 'list' && mods.length > 0" class="mods-table-container">
      <table class="data-table">
        <thead class="data-table-header">
          <tr>
            <th @click="sortBy('title')" class="sortable">
              Название
              <span v-if="sortByField === 'title'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>Изображение</th>
            <th @click="sortBy('downloads')" class="sortable">
              Загрузки
              <span v-if="sortByField === 'downloads'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>Размер</th>
            <th>Тип</th>
            <th>Версии</th>
            <th>Загрузчики</th>
            <th>Теги</th>
            <th>Разработчики</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="mod in sortedMods" 
            :key="mod.id" 
            class="data-table-row"
            @click="viewModDetails(mod)"
            style="cursor: pointer;"
          >
            <td>
              <div class="mod-title-table">
                {{ mod.title || 'Без названия' }}
              </div>
              <div class="mod-description-table" :title="mod.description">
                {{ truncateDescription(mod.description) }}
              </div>
            </td>
            <td>
              <div class="avatar-preview">
                <img 
                  v-if="mod.imageUrl" 
                  :src="getFullImageUrl(mod.imageUrl)" 
                  :alt="mod.title" 
                  class="mod-avatar-table"
                  @error="handleImageError" 
                />
                <div v-else class="no-avatar-table">🖼️</div>
              </div>
            </td>
            <td class="downloads-cell">
              {{ formatNumber(mod.downloads) }}
            </td>
            <td>{{ mod.size || '0' }} MB</td>
            <td>
              <span :class="mod.isClientside ? 'clientside-yes' : 'clientside-no'">
                {{ mod.isClientside ? '✅ Клиент' : '🖥️ Сервер' }}
              </span>
            </td>
            <td>
              <div class="versions-list">
                <span 
                  v-for="version in (mod.versions || []).slice(0, 2)" 
                  :key="version.id" 
                  class="version-tag-table"
                >
                  {{ version.title }}
                </span>
                <span v-if="(mod.versions || []).length > 2" class="more-tag">
                  +{{ (mod.versions || []).length - 2 }}
                </span>
              </div>
            </td>
            <td>
              <div class="loaders-list">
                <span 
                  v-for="loader in (mod.modLoaders || []).slice(0, 2)" 
                  :key="loader.id" 
                  class="loader-tag-table"
                >
                  {{ loader.title }}
                </span>
                <span v-if="(mod.modLoaders || []).length > 2" class="more-tag">
                  +{{ (mod.modLoaders || []).length - 2 }}
                </span>
              </div>
            </td>
            <td>
              <div class="tags-list">
                <span 
                  v-for="tag in (mod.tags || []).slice(0, 2)" 
                  :key="tag.id" 
                  class="tag-tag-table"
                >
                  {{ tag.title }}
                </span>
                <span v-if="(mod.tags || []).length > 2" class="more-tag">
                  +{{ (mod.tags || []).length - 2 }}
                </span>
              </div>
            </td>
            <td>
              <div class="developers-list">
                <span 
                  v-for="developer in (mod.developers || []).slice(0, 2)" 
                  :key="developer.id" 
                  class="developer-tag-table"
                >
                  {{ developer.nickname }}
                </span>
                <span v-if="(mod.developers || []).length > 2" class="more-tag">
                  +{{ (mod.developers || []).length - 2 }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Нет результатов -->
    <div v-if="mods.length === 0 && !loading && !searchLoading" class="no-results">
      <p>📭 Модов не найдено</p>
      <button @click="resetFilters" class="btn-reset-all">
        Сбросить фильтры
      </button>
    </div>

    <!-- Загрузка -->
    <div v-if="loading && !searchLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка модов...</p>
    </div>

    <!-- ========== МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ МОДА ========== -->
    <ModDetailsModal
      v-if="selectedMod"
      :mod="selectedMod"
      @close="selectedMod = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { modsApi, referencesApi } from '@/api/index'
import ModDetailsModal from '@/components/ModDetailsModal.vue'

// ========== ДАННЫЕ ИЗ АДМИН-ПАНЕЛИ ==========
const mods = ref([])
const selectedMod = ref(null)
const loading = ref(true)
const searchLoading = ref(false)
const loadingFilterData = ref(true)
const error = ref(null)

// Пагинация и поиск
const currentPage = ref(1)
const pageSize = ref(12)
const totalMods = ref(0)
const totalPages = ref(1)
const searchQuery = ref('')
const searchTimeout = ref(null)
const filtersTimeout = ref(null)

// Фильтры (полностью из админ-панели)
const filters = ref({
  search: '',
  versionIds: [],
  modLoaderIds: [],
  tagIds: [],
  developers: [],
  isClientside: undefined,
  minDownloads: 0,
  maxSize: 0
})

const showFiltersPanel = ref(false)
const viewMode = ref('grid') // 'grid' или 'list'

// Справочные данные
const availableVersions = ref([])
const availableModLoaders = ref([])
const availableTags = ref([])
const availableDevelopers = ref([])

// Сортировка
const sortByField = ref('createdAt')
const sortOrder = ref('desc')

// ========== COMPUTED ИЗ АДМИН-ПАНЕЛИ ==========
const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim() ||
    filters.value.versionIds.length > 0 ||
    filters.value.modLoaderIds.length > 0 ||
    filters.value.tagIds.length > 0 ||
    filters.value.developers.length > 0 ||
    filters.value.isClientside !== undefined ||
    filters.value.minDownloads > 0 ||
    filters.value.maxSize > 0
  )
})

const sortedMods = computed(() => {
  return [...mods.value].sort((a, b) => {
    let aVal = a[sortByField.value]
    let bVal = b[sortByField.value]

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

// ========== МЕТОДЫ ИЗ АДМИН-ПАНЕЛИ ==========
onMounted(async () => {
  await loadFilterData()
})

// Загрузка справочных данных для фильтров
const loadFilterData = async () => {
  try {
    loadingFilterData.value = true

    const [versions, modLoaders, tags, developers] = await Promise.all([
      referencesApi.getVersions(),
      referencesApi.getModLoaders(),
      referencesApi.getTags(),
      referencesApi.getDevelopers()
    ])

    availableVersions.value = versions.items || versions || []
    availableModLoaders.value = modLoaders.items || modLoaders || []
    availableTags.value = tags.items || tags || []
    availableDevelopers.value = developers.items || developers || []

    console.log('✅ Данные фильтров загружены:', {
      versions: availableVersions.value.length,
      loaders: availableModLoaders.value.length,
      tags: availableTags.value.length,
      developers: availableDevelopers.value.length
    })

    await performSearch()

  } catch (error) {
    console.error('❌ Ошибка загрузки данных фильтров:', error)
    error.value = 'Ошибка загрузки фильтров'
    await performSearch()
  } finally {
    loadingFilterData.value = false
    loading.value = false
  }
}

// Выполнение поиска с текущими фильтрами
const performSearch = async () => {
  searchLoading.value = true
  error.value = null

  try {
    const searchParams = {
      pageNumber: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value.trim(),
      isClientside: filters.value.isClientside,
      minDownloads: filters.value.minDownloads,
      maxSize: filters.value.maxSize,
      versionIds: filters.value.versionIds,
      modLoaderIds: filters.value.modLoaderIds,
      tagIds: filters.value.tagIds,
      developers: filters.value.developers,
      sortBy: sortByField.value,
      orderBy: sortOrder.value
    }

    console.log('🔍 Выполняем поиск с параметрами:', searchParams)

    const result = await modsApi.searchMods(searchParams)

    mods.value = Array.isArray(result.items) ? result.items : []
    totalMods.value = result.totalCount || 0
    totalPages.value = Math.ceil(totalMods.value / pageSize.value)

    console.log(`✅ Найдено модов: ${totalMods.value}, показано: ${mods.value.length}`)

  } catch (error) {
    console.error('❌ Ошибка поиска:', error)
    error.value = error.message || 'Ошибка при поиске модов'
    await loadAllMods()
  } finally {
    searchLoading.value = false
    loading.value = false
  }
}

// Fallback метод: загрузка всех модов
const loadAllMods = async () => {
  try {
    const allMods = await modsApi.getAll()
    mods.value = Array.isArray(allMods) ? allMods : []
    totalMods.value = mods.value.length
    totalPages.value = Math.ceil(totalMods.value / pageSize.value)
  } catch (err) {
    error.value = err.message || 'Ошибка загрузки модов'
  }
}

// Обработчик ввода поиска
const handleSearchInput = () => {
  currentPage.value = 1
  filters.value.search = searchQuery.value.trim()

  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    performSearch()
  }, 500)
}

// Дебаунс для фильтров
const debouncedApplyFilters = () => {
  if (filtersTimeout.value) clearTimeout(filtersTimeout.value)
  filtersTimeout.value = setTimeout(() => {
    applyFilters()
  }, 500)
}

// Применение фильтров
const applyFilters = () => {
  currentPage.value = 1
  performSearch()
}

// Сброс всех фильтров
const resetFilters = () => {
  searchQuery.value = ''
  currentPage.value = 1
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
  performSearch()
}

// Переключение панели фильтров
const toggleFilters = () => {
  showFiltersPanel.value = !showFiltersPanel.value
}

// Переключение режима отображения
const switchView = (mode) => {
  if (mode === 'grid') {
    viewMode.value = 'grid'
  } else if (mode === 'table' || mode === 'list') {
    viewMode.value = 'list'
  }
}

// Информация о результатах
const getResultsInfo = () => {
  if (searchLoading.value) return '🔍 Поиск...'
  if (loading.value) return 'Загрузка модов...'

  const searchText = searchQuery.value ? ` по запросу "${searchQuery.value}"` : ''
  const pageInfo = totalPages.value > 1 ? ` (страница ${currentPage.value}/${totalPages.value})` : ''
  return `Найдено модов: ${totalMods.value}${searchText}${pageInfo}`
}

// Пагинация
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    performSearch()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    performSearch()
  }
}

// Сортировка
const sortBy = (field) => {
  if (sortByField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortByField.value = field
    sortOrder.value = 'asc'
  }
  performSearch()
}

// Просмотр деталей мода
const viewModDetails = (mod) => {
  selectedMod.value = mod
}

// ========== УТИЛИТЫ ИЗ АДМИН-ПАНЕЛИ ==========
const API_BASE = 'http://localhost:5126'

const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_BASE}${url.startsWith('/') ? url : '/' + url}`
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
  event.target.parentElement.innerHTML = '<div class="image-error">🖼️ Ошибка загрузки</div>'
}

const truncateDescription = (description) => {
  if (!description) return 'Нет описания'
  return description.length > 100
    ? description.substring(0, 100) + '...'
    : description
}

const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return new Intl.NumberFormat('ru-RU').format(num)
}

// Очистка таймеров
onUnmounted(() => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  if (filtersTimeout.value) clearTimeout(filtersTimeout.value)
})
</script>

<style scoped>
/* Стили контейнера */
.home-view {
  min-height: 100vh;
  background-image: 
    linear-gradient(0deg, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.4)),
    url("/images/blocks/lava_flow.png");
  background-size: 64px;
  image-rendering: pixelated;
  position: relative;
}

.home-view::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    url("/images/blocks/chain.png"),
    url("/images/blocks/chain.png");
  background-size: 32px;
  background-position: 5% 0, 95% 0;
  background-repeat: no-repeat repeat;
  filter: drop-shadow(0px 15px 7px rgba(0, 0, 0, 0.75)) brightness(0.7);
  pointer-events: none;
}

/* Навигация между гридом и таблицей */
.tabs-nav {
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.5)),
    url("/images/blocks/basalt_top.png") center/64px;
  display: flex;
  gap: 10px;
  padding: 15px;
  border-bottom: 7px solid black;
  z-index: 10;
}

.tab-btn {
  font-family: "Minecraft";
  font-size: 1.2rem;
  flex: 1;
  padding: 10px 20px;
  border: 4px solid dimgray;
  background: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 0 black;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border: 4px solid white;
  color: var(--text-primary);
}

.tab-btn.active {
  background: 
    linear-gradient(0deg, rgba(255, 69, 0, 1), rgba(255, 165, 0, 0.5)),
    url("/images/blocks/magma.png") center/64px;
  border: 4px solid white;
  color: white;
}

/* ========== СТИЛИ ДЛЯ ПОИСКА И ФИЛЬТРОВ ========== */
.search-filters-container {
  background: 
    linear-gradient(0deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.5)),
    url("/images/blocks/polished_blackstone_bricks.png") center/64px;
  border-radius: 8px;
  padding: 20px;
  margin: 20px auto;
  width: 90%;
  max-width: 1200px;
  border: 4px solid black;
  box-shadow: 0 6px 0 black;
}

.search-header {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.search-input-group {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.view-toggle {
  display: flex;
  gap: 5px;
}

.view-btn {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #ddd;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 16px;
}

.view-btn.active {
  background: rgba(255, 69, 0, 0.8);
  color: white;
  border-color: #ff4500;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 12px 20px;
  border: 4px solid black;
  border-radius: 8px;
  font-size: 16px;
  background: 
    linear-gradient(0deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8)),
    url("/images/blocks/obsidian.png") center/64px;
  color: white;
  font-family: "Minecraft";
}

.search-input:focus {
  outline: none;
  border-color: white;
}

.btn-toggle-filters,
.btn-reset-filters,
.btn-apply-filters,
.btn-reset-all {
  font-family: "Minecraft";
  padding: 10px 20px;
  border: 3px solid black;
  cursor: pointer;
  box-shadow: 0 6px 0 black;
  transition: all 0.3s ease;
}

.btn-toggle-filters {
  background: 
    linear-gradient(0, rgba(255, 165, 0, 1), rgba(0, 0, 0, 0)),
    url("/images/blocks/red_sand.png") center/64px;
  color: black;
}

.btn-reset-filters {
  background: 
    linear-gradient(0, rgba(255, 0, 0, 1), rgba(0, 0, 0, 0)),
    url("/images/blocks/redstone_block.png") center/64px;
  color: white;
}

.btn-apply-filters {
  background: 
    linear-gradient(0, rgba(0, 255, 0, 1), rgba(0, 0, 0, 0)),
    url("/images/blocks/moss_block.png") center/64px;
  color: black;
}

.btn-reset-all {
  background: 
    linear-gradient(0, rgba(128, 128, 128, 1), rgba(0, 0, 0, 0)),
    url("/images/blocks/dead_brain_coral_block.png") center/64px;
  color: white;
}

/* Панель фильтров */
.filters-panel {
  background: 
    linear-gradient(0, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.5)),
    url("/images/blocks/chiseled_polished_blackstone.png") repeat-x bottom/64px,
    url("/images/blocks/chiseled_polished_blackstone.png") repeat-x top/64px,
    url("/images/blocks/polished_blackstone_bricks.png") center/64px;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  border: 4px solid black;
  box-shadow: 0 6px 0 black;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.filter-group label {
  font-weight: 500;
  color: white;
  font-size: 1rem;
  text-shadow: 0 2px 0 black;
  margin-bottom: 8px;
  display: block;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 6px;
  border: 2px solid black;
}

.filter-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
  cursor: pointer;
  padding: 4px 0;
  font-size: 14px;
}

.filter-options input[type="checkbox"],
.filter-options input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: #ff4500;
}

.range-input {
  padding: 8px 12px;
  border: 3px solid black;
  border-radius: 6px;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-family: "Minecraft";
}

.filter-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-top: 20px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

/* Пагинация */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin-top: 20px;
}

.page-btn {
  font-family: "Minecraft";
  background: 
    linear-gradient(0, rgba(0, 255, 255, 1), rgba(0, 0, 0, 0)),
    url("/images/blocks/ice.png") center/64px;
  color: black;
  border: 3px solid black;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s;
  box-shadow: 0 6px 0 black;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: 
    linear-gradient(0, rgba(128, 128, 128, 1), rgba(0, 0, 0, 0)),
    url("/images/blocks/stone.png") center/64px;
}

.page-info {
  font-size: 15px;
  color: white;
  text-shadow: 0 2px 0 black;
}

/* Сетка модов */
.mods-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Карточка мода */
.mod-card {
  position: relative;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  background: url("/images/blocks/netherrack_card.png");
  background-size: cover;
  border: 4px solid black;
  box-shadow: 0 6px 0 black;
  cursor: pointer;
  transition: all 0.3s ease;
  image-rendering: pixelated;
}

.mod-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 0 black, 0 0 15px rgba(255, 69, 0, 0.5);
  border-color: white;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 15px;
}

.card-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid black;
  flex-shrink: 0;
}

.card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-avatar .no-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #999;
}

.card-title {
  flex: 1;
}

.card-title h3 {
  margin: 0;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.3;
  text-shadow: 0 2px 0 black;
}

.card-stats {
  display: flex;
  gap: 10px;
  margin-top: 5px;
  font-size: 14px;
  color: #ccc;
}

.card-description {
  color: #ccc;
  font-size: 14px;
  line-height: 1.5;
  flex-grow: 1;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: 2px solid black;
  box-shadow: 0 4px 0 black;
}

.version-tag {
  background: 
    linear-gradient(0, rgba(0, 255, 255, 0.8), rgba(0, 0, 0, 0)),
    url("/images/blocks/ice.png") center/32px;
  color: black;
}

.loader-tag {
  background: 
    linear-gradient(0, rgba(255, 255, 0, 0.8), rgba(0, 0, 0, 0)),
    url("/images/blocks/red_sand.png") center/32px;
  color: black;
}

.developer-tag {
  background: 
    linear-gradient(0, rgba(175, 51, 255, 0.8), rgba(0, 0, 0, 0)),
    url("/images/blocks/amethyst_block.png") center/32px;
  color: black;
}

.clientside-tag {
  background: 
    linear-gradient(0, rgba(255, 165, 0, 0.8), rgba(0, 0, 0, 0)),
    url("/images/blocks/orange_wool.png") center/32px;
  color: black;
}

.card-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-view {
  font-family: "Minecraft";
  background: 
    linear-gradient(0, rgba(0, 255, 255, 0.8), rgba(0, 0, 0, 0)),
    url("/images/blocks/ice.png") center/32px;
  color: black;
  border: 2px solid black;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: 0 4px 0 black;
}

.btn-view:hover {
  transform: scale(1.05);
  border-color: white;
}

/* Таблица модов */
.mods-table-container {
  width: 90%;
  max-width: 1200px;
  margin: 20px auto;
  border: 4px solid black;
  background-color: black;
  overflow-x: auto;
}

.data-table {
  position: relative;
  border-collapse: collapse;
  width: 100%;
  table-layout: auto;
  background-color: transparent;
  min-width: 800px;
}

.data-table-header {
  background: url("/images/blocks/bedrock.png");
  background-size: 64px;
  border-bottom: 4px solid black;
}

.data-table th {
  background: rgba(0, 0, 0, 0.65);
  padding: 15px;
  text-align: center;
  color: #ff4500;
  border-bottom: 4px solid black;
  font-size: 1rem;
  white-space: nowrap;
}

.data-table th.sortable {
  cursor: pointer;
  transition: background 0.2s;
}

.data-table th.sortable:hover {
  background: rgba(255, 69, 0, 0.2);
}

.data-table td {
  padding: 12px;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  vertical-align: middle;
  color: #ccc;
}

.data-table-row {
  position: relative;
  background: 
    linear-gradient(0, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.5)),
    url("/images/blocks/crimson_stem.png"),
    url("/images/blocks/crimson_nylium.png");
  background-size: 64px;
  z-index: 0;
  transition: all 0.3s ease;
}

.data-table-row:hover {
  position: relative;
  box-shadow: 0 0 0 3px white;
  background: 
    linear-gradient(0deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.5)),
    url("/images/blocks/warped_nylium.png");
  background-size: 64px;
  z-index: 10;
  cursor: pointer;
}

/* Ячейки таблицы */
.mod-title-table {
  font-weight: 600;
  font-size: 16px;
  color: white;
  margin-bottom: 5px;
  text-shadow: 0 2px 0 black;
}

.mod-description-table {
  color: #888;
  font-size: 14px;
  line-height: 1.4;
}

.avatar-preview {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid black;
  margin: 0 auto;
}

.mod-avatar-table {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-avatar-table {
  font-size: 20px;
  color: #999;
}

.downloads-cell {
  font-family: monospace;
  font-size: 15px;
  font-weight: 500;
  color: #4fc3f7;
}

.clientside-yes {
  color: #2ecc71;
  font-weight: 500;
}

.clientside-no {
  color: #e74c3c;
  font-weight: 500;
}

.versions-list,
.loaders-list,
.tags-list,
.developers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.version-tag-table,
.loader-tag-table,
.tag-tag-table,
.developer-tag-table {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid black;
  box-shadow: 0 3px 0 black;
}

.version-tag-table {
  background: rgba(0, 255, 255, 0.2);
  color: #00ffff;
}

.loader-tag-table {
  background: rgba(255, 255, 0, 0.2);
  color: #ffff00;
}

.tag-tag-table {
  background: rgba(0, 255, 0, 0.2);
  color: #00ff00;
}

.developer-tag-table {
  background: rgba(175, 51, 255, 0.2);
  color: #af33ff;
}

.more-tag {
  background: rgba(128, 128, 128, 0.2);
  color: #ccc;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  border: 1px solid #666;
}

/* Состояния */
.no-results {
  text-align: center;
  padding: 60px;
  color: #888;
}

.no-results p {
  font-size: 18px;
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 60px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #ff4500;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.search-loading {
  color: #ff4500;
  font-weight: 500;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.search-results-info {
  font-size: 15px;
  color: #ccc;
  font-weight: 500;
  min-height: 24px;
  text-align: center;
}

/* Адаптивность */
@media (max-width: 768px) {
  .search-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    min-width: 100%;
  }

  .view-toggle {
    align-self: flex-start;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .mods-grid-container {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    flex-direction: column;
  }

  .pagination {
    flex-direction: column;
    gap: 15px;
  }

  .tabs-nav {
    flex-direction: column;
  }

  .data-table {
    font-size: 0.9rem;
  }

  .data-table th,
  .data-table td {
    padding: 8px;
  }
}

@media (max-width: 480px) {
  .mods-grid-container {
    grid-template-columns: 1fr;
    padding: 10px;
  }

  .mod-card {
    padding: 15px;
  }

  .card-header {
    flex-direction: column;
    text-align: center;
  }

  .card-avatar {
    width: 80px;
    height: 80px;
  }

  .card-stats {
    justify-content: center;
  }
}
</style>