<template>
  <div class="animated-gradient" id="app">
    <header class="header">
      <div>
        <h1>KapiMods</h1>
        <h5>Ваш универсальный менеджер модификаций</h5>
      </div>

      <div class="auth-status">
        <button @click="handleAuthClick" class="auth-btn">
          {{ isAuthenticated ? 'Выйти' : 'Войти' }}
        </button>
      </div>
    </header>

    <!-- Панель администратора - отображается только для авторизованных пользователей -->
    <main class="main" v-if="isAuthenticated">
      <!-- Индикатор загрузки данных -->
      <div v-if="loading && !searchLoading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка модов...</p>
      </div>

      <!-- Отображение ошибки с возможностью повтора -->
      <div v-else-if="error" class="error">
        <p>❌ Ошибка: {{ error }}</p>
        <button @click="performSearch" class="retry-btn">Повторить</button>
      </div>

      <!-- Основная панель управления модами -->
      <div v-else>
        <!-- Блок поиска и фильтрации модов -->
        <div class="search-filters-container">
          <div class="search-header">
            <div class="search-input-group">
              <!-- Переключатель между сеткой и списком -->
              <div class="view-toggle">
                <button class="view-btn grid" :class="{ active: viewMode === 'grid' }" @click="switchView('grid')"
                  title="Сетка">
                  ⏹️
                </button>
                <button class="view-btn list" :class="{ active: viewMode === 'list' }" @click="switchView('list')"
                  title="Список">
                  📋
                </button>
              </div>

              <!-- Поле ввода для поиска по названию или описанию -->
              <input v-model="searchQuery" @input="handleSearchInput" placeholder="Поиск модов..."
                class="search-input" />

              <!-- Кнопка открытия/закрытия расширенных фильтров -->
              <button @click="toggleFilters" class="btn-toggle-filters" :class="{ active: showFiltersPanel }">
                {{ showFiltersPanel ? 'Закрыть фильтры' : 'Фильтры' }}
              </button>

              <!-- Быстрый сброс активных фильтров -->
              <button v-if="hasActiveFilters" @click="resetFilters" class="btn-reset-filters">
                Сбросить
              </button>

              <!-- Кнопка создания нового мода -->
              <button @click="showModForm = true; selectedModForEdit = null" class="add-btn">
                Добавить мод
              </button>
            </div>

            <!-- Информация о количестве найденных модов -->
            <div class="search-results-info">
              {{ getResultsInfo() }}
            </div>

            <!-- Индикатор выполнения поиска -->
            <div v-if="searchLoading" class="search-loading">
              🔍 Поиск...
            </div>
          </div>

          <!-- Панель расширенных фильтров -->
          <div v-if="showFiltersPanel" class="filters-panel">
            <div class="filters-grid">
              <!-- Фильтр по версиям Minecraft -->
              <div class="filter-group">
                <label>Версии Minecraft</label>
                <div class="filter-options">
                  <div v-if="loadingFilterData" class="filter-loading">Загрузка...</div>
                  <label v-for="version in availableVersions" :key="version.id">
                    <input type="checkbox" :value="version.id" v-model="filters.versionIds" @change="applyFilters" />
                    {{ version.title }}
                  </label>
                </div>
              </div>

              <!-- Фильтр по загрузчикам модов (Forge, Fabric и т.д.) -->
              <div class="filter-group">
                <label>Загрузчики модов</label>
                <div class="filter-options">
                  <div v-if="loadingFilterData" class="filter-loading">Загрузка...</div>
                  <label v-for="loader in availableModLoaders" :key="loader.id">
                    <input type="checkbox" :value="loader.id" v-model="filters.modLoaderIds" @change="applyFilters" />
                    {{ loader.title }}
                  </label>
                </div>
              </div>

              <!-- Фильтр по тегам/категориям модов -->
              <div class="filter-group">
                <label>Теги</label>
                <div class="filter-options">
                  <div v-if="loadingFilterData" class="filter-loading">Загрузка...</div>
                  <label v-for="tag in availableTags" :key="tag.id">
                    <input type="checkbox" :value="tag.id" v-model="filters.tagIds" @change="applyFilters" />
                    {{ tag.title }}
                  </label>
                </div>
              </div>

              <!-- Фильтр по разработчикам модов -->
              <div class="filter-group">
                <label>Разработчики</label>
                <div class="filter-options">
                  <div v-if="loadingFilterData" class="filter-loading">Загрузка...</div>
                  <label v-for="developer in availableDevelopers" :key="developer.id">
                    <input type="checkbox" :value="developer.id" v-model="filters.developers" @change="applyFilters" />
                    {{ developer.nickname }}
                  </label>
                </div>
              </div>

              <!-- Фильтр по типу мода (клиентский/серверный) -->
              <div class="filter-group">
                <label>Тип мода</label>
                <div class="filter-options">
                  <label>
                    <input type="radio" name="mod-type" :value="undefined" v-model="filters.isClientside"
                      @change="applyFilters" />
                    Все
                  </label>
                  <label>
                    <input type="radio" name="mod-type" :value="true" v-model="filters.isClientside"
                      @change="applyFilters" />
                    Клиентский
                  </label>
                  <label>
                    <input type="radio" name="mod-type" :value="false" v-model="filters.isClientside"
                      @change="applyFilters" />
                    Серверный
                  </label>
                </div>
              </div>

              <!-- Числовые фильтры (скачивания, размер) -->
              <div class="filter-group">
                <label>Минимум скачиваний</label>
                <input type="number" v-model.number="filters.minDownloads" min="0" @input="debouncedApplyFilters"
                  class="range-input" placeholder="0" />

                <label>Максимальный размер (MB)</label>
                <input type="number" v-model.number="filters.maxSize" min="0" step="0.1" @input="debouncedApplyFilters"
                  class="range-input" placeholder="Любой" />
              </div>
            </div>

            <!-- Кнопки управления фильтрами -->
            <div class="filter-actions">
              <button @click="applyFilters" class="btn-apply-filters">
                Применить фильтры
              </button>
              <button @click="resetFilters" class="btn-reset-all">
                Сбросить всё
              </button>
            </div>
          </div>

          <!-- Навигация по страницам результатов -->
          <div v-if="totalPages > 1" class="pagination">
            <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">
              ← Назад
            </button>

            <span class="page-info">
              Страница {{ currentPage }} из {{ totalPages }}
            </span>

            <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">
              Вперед →
            </button>
          </div>
        </div>

        <!-- Отображение модов в виде карточек (режим сетки) -->
        <div v-if="viewMode === 'grid' && mods.length > 0" class="mods-grid">
          <div v-for="mod in sortedMods" :key="mod.id" class="mod-card">
            <!-- Верхняя часть карточки с аватаркой и заголовком -->
            <div class="card-header">
              <div class="card-avatar" @click="viewModDetails(mod)">
                <img v-if="mod.imageUrl" :src="getFullImageUrl(mod.imageUrl)" :alt="mod.title"
                  @error="handleImageError" />
                <div v-else class="no-avatar">🖼️</div>
              </div>

              <div class="card-title">
                <h3>{{ mod.title || 'Без названия' }}</h3>
                <div class="card-stats">
                  <span class="downloads">📥 {{ formatNumber(mod.downloads) }}</span>
                  <span class="size">💾 {{ mod.size || '0' }} MB</span>
                </div>
              </div>
            </div>

            <!-- Краткое описание мода -->
            <div class="card-description">
              {{ truncateDescription(mod.description) }}
            </div>

            <!-- Теги и метки (версии, загрузчики, тип) -->
            <div class="card-tags">
              <span v-for="version in (mod.versions || []).slice(0, 2)" :key="version.id" class="tag version-tag">
                {{ version.title }}
              </span>
              <span v-for="loader in (mod.modLoaders || []).slice(0, 1)" :key="loader.id" class="tag loader-tag">
                {{ loader.title }}
              </span>
              <span v-if="mod.isClientside" class="tag clientside-tag">Клиентский</span>

              <!-- Информация о разработчиках в карточке -->
              <span v-for="developer in (mod.developers || []).slice(0, 1)" :key="developer.id"
                class="tag developer-tag">
                👨‍💻 {{ developer.nickname }}
              </span>
            </div>

            <!-- Кнопки управления модом -->
            <div class="card-actions">
              <button @click="viewModDetails(mod)" class="btn-view" title="Подробнее">
                👁️ Подробно
              </button>
              <button @click="editMod(mod)" class="btn-edit" title="Редактировать">
                ✏️
              </button>
              <button @click="deleteMod(mod.id)" class="btn-delete" title="Удалить">
                🗑️
              </button>
            </div>
          </div>
        </div>

        <!-- Отображение модов в виде таблицы (режим списка) -->
        <div v-if="viewMode === 'list' && mods.length > 0" class="mods-table-container">
          <table class="mods-table">
            <thead>
              <tr>
                <!-- Заголовки таблицы с возможностью сортировки -->
                <th @click="sortBy('title')" class="sortable">
                  Название
                  <span v-if="sortByField === 'title'">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th>Аватарка</th>
                <th @click="sortBy('downloads')" class="sortable">
                  Загрузки
                  <span v-if="sortByField === 'downloads'">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th>Размер (МБ)</th>
                <th>Клиентский</th>
                <th>Версии</th>
                <th>Загрузчики</th>
                <th>Теги</th>
                <!-- Колонка для разработчиков -->
                <th>Разработчики</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mod in sortedMods" :key="mod.id">
                <!-- Название и описание мода -->
                <td>
                  <div class="mod-title">
                    {{ mod.title || 'Без названия' }}
                  </div>
                  <div class="mod-description" :title="mod.description">
                    {{ truncateDescription(mod.description) }}
                  </div>
                </td>
                <!-- Аватарка мода -->
                <td>
                  <div class="avatar-preview" @click="viewModDetails(mod)" title="Нажмите для просмотра">
                    <img v-if="mod.imageUrl" :src="getFullImageUrl(mod.imageUrl)" :alt="mod.title" class="mod-avatar"
                      @error="handleImageError" />
                    <div v-else class="no-avatar">
                      🖼️
                    </div>
                  </div>
                </td>
                <!-- Статистика скачиваний -->
                <td class="downloads-cell">
                  {{ formatNumber(mod.downloads) }}
                </td>
                <!-- Размер файла -->
                <td>{{ mod.size || '0' }}</td>
                <!-- Индикатор клиентской/серверной стороны -->
                <td>
                  <span :class="mod.isClientside ? 'clientside-yes' : 'clientside-no'">
                    {{ mod.isClientside ? '✅ Да' : '❌ Нет' }}
                  </span>
                </td>
                <!-- Список поддерживаемых версий Minecraft -->
                <td>
                  <div class="versions-list">
                    <span v-for="version in (mod.versions || []).slice(0, 3)" :key="version.id" class="version-tag">
                      {{ version.title }}
                    </span>
                    <span v-if="(mod.versions || []).length > 3" class="more-tag">
                      +{{ (mod.versions || []).length - 3 }}
                    </span>
                  </div>
                </td>
                <!-- Список загрузчиков -->
                <td>
                  <div class="loaders-list">
                    <span v-for="loader in (mod.modLoaders || []).slice(0, 2)" :key="loader.id" class="loader-tag">
                      {{ loader.title }}
                    </span>
                    <span v-if="(mod.modLoaders || []).length > 2" class="more-tag">
                      +{{ (mod.modLoaders || []).length - 2 }}
                    </span>
                  </div>
                </td>
                <!-- Список тегов -->
                <td>
                  <div class="tags-list">
                    <span v-for="tag in (mod.tags || []).slice(0, 2)" :key="tag.id" class="tag-tag">
                      {{ tag.title }}
                    </span>
                    <span v-if="(mod.tags || []).length > 2" class="more-tag">
                      +{{ (mod.tags || []).length - 2 }}
                    </span>
                    <span v-else-if="!(mod.tags || []).length" class="no-data">
                      —
                    </span>
                  </div>
                </td>
                <!-- Информация о разработчиках -->
                <td>
                  <div class="developers-list">
                    <span v-for="developer in (mod.developers || []).slice(0, 2)" :key="developer.id"
                      class="developer-tag">
                      👨‍💻 {{ developer.nickname }}
                    </span>
                    <span v-if="(mod.developers || []).length > 2" class="more-tag">
                      +{{ (mod.developers || []).length - 2 }}
                    </span>
                    <span v-else-if="!(mod.developers || []).length" class="no-data">
                      —
                    </span>
                  </div>
                </td>
                <!-- Кнопки действий -->
                <td class="actions-cell">
                  <button @click="viewModDetails(mod)" class="btn-view" title="Просмотр деталей">
                    👁️
                  </button>
                  <button @click="editMod(mod)" class="btn-edit" title="Редактировать">
                    ✏️
                  </button>
                  <button @click="deleteMod(mod.id)" class="btn-delete" title="Удалить">
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Сообщение об отсутствии результатов -->
        <div v-if="mods.length === 0 && !loading && !searchLoading" class="no-results">
          <p>📭 Модов не найдено</p>
          <button @click="resetFilters" class="btn-reset-all">
            Сбросить фильтры
          </button>
        </div>

        <!-- Статистика по результатам поиска -->
        <div v-if="mods.length > 0" class="stats">
          <p>Всего модов: {{ totalMods }}</p>
          <p>Показано: {{ mods.length }}</p>
          <p v-if="searchQuery">Поиск: "{{ searchQuery }}"</p>
          <p v-if="hasActiveFilters">Активные фильтры: {{ activeFiltersCount }}</p>
        </div>
      </div>

      <!-- Детальная информация о моде (всплывающее окно) -->
      <div v-if="selectedMod" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ selectedMod.title }}</h2>
            <button @click="closeModal" class="modal-close">×</button>
          </div>

          <div class="modal-body">
            <!-- Основная информация о моде -->
            <div class="modal-section">
              <div class="mod-main-info">
                <!-- Крупное изображение мода -->
                <div class="mod-avatar-large">
                  <img v-if="selectedMod.imageUrl" :src="getFullImageUrl(selectedMod.imageUrl)" :alt="selectedMod.title"
                    @error="handleImageError" />
                  <div v-else class="no-avatar-large">
                    🖼️ Нет аватарки
                  </div>
                </div>

                <!-- Полное описание мода -->
                <div class="mod-description-full">
                  <h3>Описание</h3>
                  <p>{{ selectedMod.description || 'Нет описания' }}</p>
                </div>
              </div>
            </div>

            <!-- Статистические данные мода -->
            <div class="modal-grid">
              <div class="modal-item">
                <strong>Загрузки:</strong>
                <span>{{ formatNumber(selectedMod.downloads) }}</span>
              </div>
              <div class="modal-item">
                <strong>Размер:</strong>
                <span>{{ selectedMod.size || '0' }} МБ</span>
              </div>
              <div class="modal-item">
                <strong>Клиентский:</strong>
                <span :class="selectedMod.isClientside ? 'clientside-yes' : 'clientside-no'">
                  {{ selectedMod.isClientside ? 'Да' : 'Нет' }}
                </span>
              </div>
              <div class="modal-item">
                <strong>Создан:</strong>
                <span>{{ formatDate(selectedMod.createdAt) }}</span>
              </div>
            </div>

            <!-- Поддерживаемые версии Minecraft -->
            <div class="modal-section" v-if="selectedMod.versions && selectedMod.versions.length">
              <h3>Версии Minecraft</h3>
              <div class="tags-list">
                <span v-for="version in selectedMod.versions" :key="version.id" class="tag version-tag">
                  {{ version.title }}
                </span>
              </div>
            </div>

            <!-- Теги мода -->
            <div class="modal-section" v-if="selectedMod.tags && selectedMod.tags.length">
              <h3>Теги</h3>
              <div class="tags-list">
                <span v-for="tag in selectedMod.tags" :key="tag.id" class="tag tag-tag">
                  {{ tag.title }}
                </span>
              </div>
            </div>

            <!-- Разработчики мода -->
            <div class="modal-section" v-if="selectedMod.developers && selectedMod.developers.length">
              <h3>Разработчики</h3>
              <div class="tags-list">
                <span v-for="developer in selectedMod.developers" :key="developer.id" class="tag developer-tag">
                  👨‍💻 {{ developer.nickname }}
                </span>
              </div>
            </div>

            <!-- Загрузчики модов -->
            <div class="modal-section" v-if="selectedMod.modLoaders && selectedMod.modLoaders.length">
              <h3>Загрузчики модов</h3>
              <div class="tags-list">
                <span v-for="loader in selectedMod.modLoaders" :key="loader.id" class="tag loader-tag">
                  {{ loader.title }}
                </span>
              </div>
            </div>

            <!-- Галерея изображений мода -->
            <div class="modal-section" v-if="galleryLoading">
              <h3>Галерея</h3>
              <p>Загрузка изображений...</p>
            </div>
            <div class="modal-section" v-else-if="galleryImages.length > 0">
              <h3>Галерея изображений</h3>
              <div class="gallery-grid">
                <div v-for="image in galleryImages" :key="image.id" class="gallery-item" @click="openLightbox(image)">
                  <img :src="getFullImageUrl(image.imageUrl)" :alt="image.fileName" @error="handleImageError" />
                  <div class="gallery-overlay">
                    <span>{{ image.fileName }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Источники для скачивания мода -->
            <div class="modal-section" v-if="sourcesLoading">
              <h3>Источники скачивания</h3>
              <p>Загрузка источников...</p>
            </div>
            <div class="modal-section" v-else-if="downloadSources.length > 0">
              <h3>Источники скачивания</h3>
              <div class="sources-list">
                <div v-for="source in downloadSources" :key="source.id" class="source-item">
                  <div class="source-header">
                    <h4>{{ source.title }}</h4>
                    <span class="file-size" v-if="source.fileSize">
                      {{ formatFileSize(source.fileSize) }}
                    </span>
                  </div>

                  <!-- Ссылка на локальный файл -->
                  <div v-if="source.filePath" class="file-source">
                    <p><strong>Файл:</strong> {{ source.fileName }}</p>
                    <button @click="downloadFile(source)" class="download-btn">
                      📥 Скачать файл
                    </button>
                  </div>

                  <!-- Внешняя ссылка на скачивание -->
                  <div v-if="source.url" class="url-source">
                    <p><strong>Ссылка:</strong></p>
                    <a :href="source.url" target="_blank" class="external-link">
                      🔗 {{ truncateUrl(source.url) }}
                    </a>
                  </div>

                  <!-- Совместимость с версиями и загрузчиками -->
                  <div class="source-tags">
                    <div v-if="source.versions && source.versions.length" class="source-versions">
                      <strong>Версии:</strong>
                      <span v-for="version in source.versions" :key="version.id" class="small-tag">
                        {{ version.title }}
                      </span>
                    </div>

                    <div v-if="source.modLoaders && source.modLoaders.length" class="source-loaders">
                      <strong>Загрузчики:</strong>
                      <span v-for="loader in source.modLoaders" :key="loader.id" class="small-tag loader-tag">
                        {{ loader.title }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Уведомления об отсутствии данных -->
            <div class="modal-section" v-if="!galleryLoading && galleryImages.length === 0">
              <h3>Галерея</h3>
              <p class="empty-message">📷 Нет изображений галереи</p>
            </div>

            <div class="modal-section" v-if="!sourcesLoading && downloadSources.length === 0">
              <h3>Источники скачивания</h3>
              <p class="empty-message">📥 Нет источников скачивания</p>
            </div>
          </div>

          <!-- Кнопки управления в модальном окне -->
          <div class="modal-footer">
            <button @click="editMod(selectedMod)" class="btn-edit-large">
              ✏️ Редактировать мод
            </button>
            <button @click="closeModal" class="btn-close">
              Закрыть
            </button>
          </div>
        </div>
      </div>

      <!-- Панель быстрого добавления справочных элементов -->
        <QuickAddPanel @item-added="handleItemAdded" />
        <EntitiesManager @entities-updated="handleEntitiesUpdated" />
    </main>

    <!-- Страница для неавторизованных пользователей -->
    <div v-else class="not-authorized">
      <h2>Требуется авторизация</h2>
      <p>Для работы с админ-панелью необходимо войти в систему</p>
      <button @click="showAuthModal = true" class="login-btn">
        Войти
      </button>
    </div>

    <!-- Модальное окно авторизации -->
    <AuthModal v-if="showAuthModal" @close="showAuthModal = false" @login-success="handleLoginSuccess" />

    <!-- Модальное окно редактирования/создания мода -->
    <ModFormModal v-if="showModForm" :mod="selectedModForEdit" @close="closeModForm" @saved="handleModSaved" />

    <!-- Увеличенный просмотр изображения галереи -->
    <div v-if="lightboxImage" class="lightbox-overlay" @click.self="closeLightbox">
      <div class="lightbox">
        <button @click="closeLightbox" class="lightbox-close">×</button>
        <img :src="getFullImageUrl(lightboxImage.imageUrl)" :alt="lightboxImage.fileName" />
        <div class="lightbox-info">
          <p>{{ lightboxImage.fileName }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { modsApi, clearAuthToken, referencesApi, galleriesApi, sourcesApi, filesApi } from './api.js'
import AuthModal from './components/AuthModal.vue'
import QuickAddPanel from './components/QuickAddPanel.vue'
import ModFormModal from './components/ModFormModal.vue'
import EntitiesManager from './components/EntitiesManager.vue'

// Базовый URL для API
const API_BASE = 'http://localhost:5126'

export default {
  name: 'App',

  components: {
    AuthModal,
    QuickAddPanel,
    ModFormModal,
    EntitiesManager
  },

  data() {
    return {
      // Основные данные
      mods: [],                       // Список отображаемых модов
      selectedMod: null,              // Выбранный мод для просмотра деталей
      galleryImages: [],              // Изображения галереи для текущего мода
      downloadSources: [],             // Источники скачивания для текущего мода
      lightboxImage: null,             // Изображение для увеличенного просмотра

      // Состояния загрузки
      loading: true,                   // Индикатор первоначальной загрузки
      searchLoading: false,             // Индикатор выполнения поиска
      loadingFilterData: true,          // Загрузка данных для фильтров
      galleryLoading: false,            // Загрузка галереи
      sourcesLoading: false,            // Загрузка источников
      error: null,                      // Текст ошибки

      // Пагинация и поиск
      currentPage: 1,                   // Текущая страница
      pageSize: 3,                      // Элементов на странице
      totalMods: 0,                      // Общее количество модов
      totalPages: 1,                     // Всего страниц
      searchQuery: '',                   // Текст поиска
      searchTimeout: null,                // Таймер для отложенного поиска
      filtersTimeout: null,               // Таймер для отложенного применения фильтров

      // Параметры фильтрации
      filters: {
        search: '',
        versionIds: [],
        modLoaderIds: [],
        tagIds: [],
        developers: [],
        isClientside: undefined,
        minDownloads: 0,
        maxSize: 0
      },
      showFiltersPanel: false,           // Отображение панели фильтров
      viewMode: 'list',                   // Режим отображения: 'grid' или 'list'

      // Справочные данные для фильтров
      availableVersions: [],              // Доступные версии Minecraft
      availableModLoaders: [],             // Доступные загрузчики модов
      availableTags: [],                    // Доступные теги
      availableDevelopers: [],               // Доступные разработчики

      // Параметры сортировки
      sortByField: 'createdAt',            // Поле для сортировки
      sortOrder: 'desc',                    // Направление сортировки

      // Авторизация
      isAuthenticated: false,               // Статус авторизации
      showAuthModal: false,                  // Отображение модального окна авторизации

      // Управление формами
      showModForm: false,                     // Отображение формы мода
      selectedModForEdit: null,                // Мод для редактирования

      // Состояние скачивания файлов
      downloadingFiles: {}                     // ID файлов, которые скачиваются
    }
  },

  computed: {
    // Проверка наличия активных фильтров
    hasActiveFilters() {
      return (
        this.searchQuery.trim() ||
        this.filters.versionIds.length > 0 ||
        this.filters.modLoaderIds.length > 0 ||
        this.filters.tagIds.length > 0 ||
        this.filters.developers.length > 0 ||
        this.filters.isClientside !== undefined ||
        this.filters.minDownloads > 0 ||
        this.filters.maxSize > 0
      )
    },

    // Подсчет количества активных фильтров
    activeFiltersCount() {
      let count = 0
      if (this.searchQuery.trim()) count++
      if (this.filters.versionIds.length) count++
      if (this.filters.modLoaderIds.length) count++
      if (this.filters.tagIds.length) count++
      if (this.filters.developers.length) count++
      if (this.filters.isClientside !== undefined) count++
      if (this.filters.minDownloads > 0) count++
      if (this.filters.maxSize > 0) count++
      return count
    },

    // Отсортированный список модов
    sortedMods() {
      return [...this.mods].sort((a, b) => {
        let aVal = a[this.sortByField]
        let bVal = b[this.sortByField]

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }
  },

  mounted() {
    // Проверка авторизации при загрузке компонента
    this.checkAuth()
  },

  methods: {
    // Проверка наличия токена авторизации
    checkAuth() {
      const token = localStorage.getItem('token')
      if (token) {
        this.isAuthenticated = true
        this.loadFilterData()
      }
    },

    // Загрузка справочных данных для фильтров
    async loadFilterData() {
      try {
        this.loadingFilterData = true

        const [versions, modLoaders, tags, developers] = await Promise.all([
          referencesApi.getVersions(),
          referencesApi.getModLoaders(),
          referencesApi.getTags(),
          referencesApi.getDevelopers()
        ])

        this.availableVersions = versions.items || versions || []
        this.availableModLoaders = modLoaders.items || modLoaders || []
        this.availableTags = tags.items || tags || []
        this.availableDevelopers = developers.items || developers || []

        // После загрузки фильтров выполняем поиск модов
        await this.performSearch()

      } catch (error) {
        console.error('Ошибка загрузки данных фильтров:', error)
        this.error = 'Ошибка загрузки фильтров'
        // Пытаемся загрузить моды даже без фильтров
        await this.performSearch()
      } finally {
        this.loadingFilterData = false
        this.loading = false
      }
    },

    // Выполнение поиска с текущими параметрами фильтрации
    async performSearch() {
      if (!this.isAuthenticated) return

      this.searchLoading = true
      this.error = null

      try {
        // Формируем параметры запроса
        const searchParams = {
          pageNumber: this.currentPage,
          pageSize: this.pageSize,
          search: this.searchQuery.trim(),
          isClientside: this.filters.isClientside,
          minDownloads: this.filters.minDownloads,
          maxSize: this.filters.maxSize,
          versionIds: this.filters.versionIds,
          modLoaderIds: this.filters.modLoaderIds,
          tagIds: this.filters.tagIds,
          developers: this.filters.developers,
          sortBy: this.sortByField,
          orderBy: this.sortOrder
        }

        // Отправляем запрос на сервер
        const result = await modsApi.searchMods(searchParams)

        this.mods = Array.isArray(result.items) ? result.items : []
        this.totalMods = result.totalCount || 0
        this.totalPages = Math.ceil(this.totalMods / this.pageSize)

      } catch (error) {
        console.error('Ошибка поиска:', error)
        this.error = error.message || 'Ошибка при поиске модов'
        // Запасной вариант - загрузка всех модов
        await this.loadAllMods()
      } finally {
        this.searchLoading = false
        this.loading = false
      }
    },

    // Загрузка всех модов (запасной метод)
    async loadAllMods() {
      try {
        const allMods = await modsApi.getAll()
        this.mods = Array.isArray(allMods) ? allMods : []
        this.totalMods = this.mods.length
        this.totalPages = Math.ceil(this.totalMods / this.pageSize)
      } catch (err) {
        this.error = err.message || 'Ошибка загрузки модов'
      }
    },

    // Обработка ввода текста поиска
    handleSearchInput() {
      this.currentPage = 1
      this.filters.search = this.searchQuery.trim()

      // Отложенный поиск для уменьшения нагрузки
      if (this.searchTimeout) clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.performSearch()
      }, 500)
    },

    // Отложенное применение фильтров
    debouncedApplyFilters() {
      if (this.filtersTimeout) clearTimeout(this.filtersTimeout)
      this.filtersTimeout = setTimeout(() => {
        this.applyFilters()
      }, 500)
    },

    // Применение выбранных фильтров
    applyFilters() {
      this.currentPage = 1
      this.performSearch()
    },

    // Сброс всех фильтров к значениям по умолчанию
    resetFilters() {
      this.searchQuery = ''
      this.currentPage = 1
      this.filters = {
        search: '',
        versionIds: [],
        modLoaderIds: [],
        tagIds: [],
        developers: [],
        isClientside: undefined,
        minDownloads: 0,
        maxSize: 0
      }
      this.performSearch()
    },

    // Переключение видимости панели фильтров
    toggleFilters() {
      this.showFiltersPanel = !this.showFiltersPanel
    },

    // Переключение режима отображения
    switchView(mode) {
      this.viewMode = mode
    },

    // Формирование текста с информацией о результатах
    getResultsInfo() {
      if (this.searchLoading) return '🔍 Поиск...'
      if (this.loading) return 'Загрузка модов...'

      const searchText = this.searchQuery ? ` по запросу "${this.searchQuery}"` : ''
      const pageInfo = this.totalPages > 1 ? ` (страница ${this.currentPage}/${this.totalPages})` : ''
      return `Найдено модов: ${this.totalMods}${searchText}${pageInfo}`
    },

    // Переход на предыдущую страницу
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
        this.performSearch()
      }
    },

    // Переход на следующую страницу
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        this.performSearch()
      }
    },

    // Сортировка по указанному полю
    sortBy(field) {
      if (this.sortByField === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortByField = field
        this.sortOrder = 'asc'
      }
      this.performSearch()
    },

    // Просмотр детальной информации о моде
    async viewModDetails(mod) {
      this.selectedMod = mod
      this.galleryLoading = true
      this.sourcesLoading = true

      try {
        // Загружаем галерею и источники параллельно
        const [gallery, sources] = await Promise.all([
          galleriesApi.getByModId(mod.id),
          sourcesApi.getByModId(mod.id)
        ])

        this.galleryImages = Array.isArray(gallery) ? gallery : []
        this.downloadSources = Array.isArray(sources) ? sources : []

      } catch (error) {
        console.error('Ошибка загрузки деталей:', error)
        this.galleryImages = []
        this.downloadSources = []
      } finally {
        this.galleryLoading = false
        this.sourcesLoading = false
      }
    },

    // Скачивание файла мода
    async downloadFile(source) {
      try {
        // Помечаем файл как скачиваемый
        this.downloadingFiles[source.id] = true

        // Получаем имя файла из пути
        const fileName = this.extractFileNameFromPath(source)

        // Скачиваем файл через API
        const blob = await filesApi.downloadModFile(fileName)

        // Создаем ссылку для скачивания
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url

        // Используем оригинальное имя файла
        const downloadName = source.fileName || fileName
        a.download = downloadName

        document.body.appendChild(a)
        a.click()

        // Очищаем ресурсы
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

      } catch (error) {
        console.error('Ошибка скачивания файла:', error)
        alert('Ошибка при скачивании файла: ' + error.message)
      } finally {
        // Снимаем блокировку
        this.downloadingFiles[source.id] = false
      }
    },

    // Извлечение имени файла из пути
    extractFileNameFromPath(source) {
      // Приоритет: filePath -> fileName -> ID
      if (source.filePath) {
        return source.filePath.split('/').pop()
      }
      if (source.fileName) {
        return source.fileName
      }
      return `${source.id}.jar`
    },

    // Формирование полного URL для изображения
    getFullImageUrl(url) {
      if (!url) return ''
      if (url.startsWith('http')) return url
      return `${API_BASE}${url.startsWith('/') ? url : '/' + url}`
    },

    // Обработка ошибки загрузки изображения
    handleImageError(event) {
      event.target.style.display = 'none'
      event.target.parentElement.innerHTML = '<div class="image-error">🖼️ Ошибка загрузки</div>'
    },

    // Укорачивание длинного описания
    truncateDescription(description) {
      if (!description) return 'Нет описания'
      return description.length > 100
        ? description.substring(0, 100) + '...'
        : description
    },

    // Укорачивание длинного URL
    truncateUrl(url) {
      if (!url) return ''
      if (url.length > 50) {
        return url.substring(0, 30) + '...' + url.substring(url.length - 20)
      }
      return url
    },

    // Форматирование числа с разделителями разрядов
    formatNumber(num) {
      if (!num && num !== 0) return '0'
      return new Intl.NumberFormat('ru-RU').format(num)
    },

    // Форматирование размера файла в человекочитаемый вид
    formatFileSize(bytes) {
      if (!bytes) return '0 Б'
      const units = ['Б', 'КБ', 'МБ', 'ГБ']
      let size = bytes
      let unitIndex = 0
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
      }
      return `${size.toFixed(1)} ${units[unitIndex]}`
    },

    // Форматирование даты
    formatDate(dateString) {
      if (!dateString) return 'Нет даты'
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    // Открытие формы редактирования мода
    editMod(mod) {
      this.selectedModForEdit = mod
      this.showModForm = true
    },

    // Закрытие формы мода
    closeModForm() {
      this.showModForm = false
      this.selectedModForEdit = null
    },

    // Обработка сохранения мода
    handleModSaved() {
      this.performSearch() // Обновляем список с текущими фильтрами
      this.closeModForm()
      if (this.selectedMod) {
        this.closeModal()
      }
    },

    // Удаление мода
    async deleteMod(id) {
      if (!confirm('Удалить этот мод?')) return
      try {
        await this.deleteModGalleryFiles(id)
        await modsApi.delete(id)
        alert('Мод удален')
        this.performSearch()
      } catch (err) {
        alert('Ошибка удаления: ' + err.message)
      }
    },

    // Удаление всех файлов галереи мода
    async deleteModGalleryFiles(modId) {
      try {
        // Получаем список изображений галереи
        const galleryImages = await galleriesApi.getByModId(modId)

        // Удаляем каждое изображение
        for (const image of galleryImages) {
          try {
            await this.deleteGalleryImage(image)
          } catch (error) {
            console.warn(`Не удалось удалить изображение ${image.id}:`, error.message)
          }
        }

      } catch (error) {
        console.error('Ошибка при удалении галереи:', error)
        // Продолжаем удаление мода даже при ошибке с галереей
      }
    },

    // Удаление одного изображения галереи
    async deleteGalleryImage(image) {
      // Удаляем файл с сервера
      if (image.imageUrl) {
        const fileName = image.imageUrl.split('/').pop()
        try {
          await filesApi.deleteGalleryImage(fileName)
        } catch (error) {
          console.warn(`Ошибка удаления файла ${fileName}:`, error.message)
        }
      }

      // Удаляем запись из базы данных
      await galleriesApi.delete(image.id)
    },

    // Закрытие модального окна с деталями
    closeModal() {
      this.selectedMod = null
      this.galleryImages = []
      this.downloadSources = []
      this.lightboxImage = null
    },

    // Открытие увеличенного просмотра изображения
    openLightbox(image) {
      this.lightboxImage = image
    },

    // Закрытие увеличенного просмотра
    closeLightbox() {
      this.lightboxImage = null
    },

    // Обработка клика по кнопке авторизации
    handleAuthClick() {
      if (this.isAuthenticated) {
        this.logout()
      } else {
        this.showAuthModal = true
      }
    },

    // Обработка успешного входа
    handleLoginSuccess(token) {
      this.isAuthenticated = true
      this.showAuthModal = false

      // Сохраняем имя пользователя
      const username = localStorage.getItem('username') || 'Пользователь'
      this.username = username

      // Загружаем данные
      this.loadFilterData()
    },

    // Выход из системы
    logout() {
      if (confirm('Выйти из системы?')) {
        clearAuthToken()
        this.isAuthenticated = false
        this.username = ''
        this.showAuthModal = false
        this.mods = []
        this.totalMods = 0
      }
    },

    // Обработка добавления элемента из панели быстрого добавления
    handleItemAdded({ type, data }) {
      // Добавляем новый элемент в соответствующий список фильтров
      switch (type) {
        case 'version':
          this.availableVersions.push(data)
          break
        case 'modloader':
          this.availableModLoaders.push(data)
          break
        case 'tag':
          this.availableTags.push(data)
          break
        case 'developer':
          this.availableDevelopers.push(data)
          break
      }
    },

    // Обработка обновления справочных сущностей
    handleEntitiesUpdated({ type, data, action, id }) {
      if (action === 'delete') {
        // Удаляем элемент из списка фильтров
        switch (type) {
          case 'version':
            if (this.availableVersions) {
              this.availableVersions = this.availableVersions.filter(v => v.id !== id)
            }
            break
          case 'modloader':
            if (this.availableModLoaders) {
              this.availableModLoaders = this.availableModLoaders.filter(m => m.id !== id)
            }
            break
          case 'tag':
            if (this.availableTags) {
              this.availableTags = this.availableTags.filter(t => t.id !== id)
            }
            break
          case 'developer':
            if (this.availableDevelopers) {
              this.availableDevelopers = this.availableDevelopers.filter(d => d.id !== id)
            }
            break
        }
      } else {
        // Обновляем данные фильтров
        this.refreshFilterData()
      }
    },

    // Обновление данных фильтров
    async refreshFilterData() {
      try {
        const [versions, modLoaders, tags, developers] = await Promise.all([
          referencesApi.getVersions(),
          referencesApi.getModLoaders(),
          referencesApi.getTags(),
          referencesApi.getDevelopers()
        ])

        this.availableVersions = versions.items || versions || []
        this.availableModLoaders = modLoaders.items || modLoaders || []
        this.availableTags = tags.items || tags || []
        this.availableDevelopers = developers.items || developers || []

      } catch (error) {
        console.error('Ошибка обновления фильтров:', error)
      }
    }
  },

  // Очистка таймеров при уничтожении компонента
  beforeUnmount() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout)
    if (this.filtersTimeout) clearTimeout(this.filtersTimeout)
  }
}
</script>

<style scoped>
/* Стили для EntitiesManager */
.quick-add-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.quick-add-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Стили для поиска и фильтров */
.search-filters-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.search-header {
  display: flex;
  flex-direction: column;
  gap: 15px;
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
  background: #f8f9fa;
  border: 2px solid #ddd;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 16px;
}

.view-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.view-btn.grid.active {
  background: #2ecc71;
  border-color: #27ae60;
}

.view-btn.list.active {
  background: #3498db;
  border-color: #2980b9;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 12px 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.btn-toggle-filters {
  background: #f39c12;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-toggle-filters:hover,
.btn-toggle-filters.active {
  background: #d68910;
}

.btn-reset-filters {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-reset-filters:hover {
  background: #c0392b;
}

.add-btn {
  background: #2ecc71;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.2s;
  white-space: nowrap;
}

.add-btn:hover {
  background: #27ae60;
}

.search-results-info {
  font-size: 15px;
  color: #495057;
  font-weight: 500;
  min-height: 24px;
}

.search-loading {
  color: #3498db;
  font-weight: 500;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* Панель фильтров */
.filters-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  border: 1px solid #e0e0e0;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-group label {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #ddd;
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

.filter-options label:hover {
  background: #f5f5f5;
  border-radius: 4px;
}

.filter-options input[type="checkbox"],
.filter-options input[type="radio"] {
  margin: 0;
}

.filter-loading {
  color: #6c757d;
  font-style: italic;
  font-size: 14px;
}

.range-input {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.range-input:focus {
  outline: none;
  border-color: #3498db;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn-apply-filters {
  background: #2ecc71;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-apply-filters:hover {
  background: #27ae60;
}

.btn-reset-all {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-reset-all:hover {
  background: #7f8c8d;
}

/* Пагинация */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin: 20px 0 0;
}

.page-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.2s;
}

.page-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.page-btn:not(:disabled):hover {
  background: #2980b9;
}

.page-info {
  font-size: 15px;
  color: #495057;
}

/* Стили для сетки модов */
.mods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.mod-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  gap: 15px;
  border: 1px solid #e9ecef;
}

.mod-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
  cursor: pointer;
  background: #f0f0f0;
  border: 2px solid #e0e0e0;
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
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.card-stats {
  display: flex;
  gap: 10px;
  margin-top: 5px;
  font-size: 14px;
  color: #6c757d;
}

.card-description {
  color: #6c757d;
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
  white-space: nowrap;
}

.version-tag {
  background: #e3f2fd;
  color: #1976d2;
}

.loader-tag {
  background: #e8f5e9;
  color: #2e7d32;
}

.developer-tag {
  background: #f3e5f5;
  color: #7b1fa2;
}

.clientside-tag {
  background: #fff3e0;
  color: #f57c00;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.card-actions button {
  background: none;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
  transition: background 0.2s;
}

.card-actions .btn-view:hover {
  background: #e3f2fd;
}

.card-actions .btn-edit:hover {
  background: #fff3e0;
}

.card-actions .btn-delete:hover {
  background: #ffebee;
}

/* Нет результатов */
.no-results {
  text-align: center;
  padding: 60px;
  color: #6c757d;
  background: white;
  border-radius: 12px;
  margin-bottom: 30px;
}

.no-results p {
  font-size: 18px;
  margin-bottom: 20px;
}

/* Информация о результатах */
.stats {
  text-align: center;
  color: #6c757d;
  font-size: 14px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 20px;
}

.stats p {
  margin: 5px 0;
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

  .mods-grid {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    flex-direction: column;
  }

  .pagination {
    flex-direction: column;
    gap: 15px;
  }
}

/* Базовые стили */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #f5f7fa;
  color: #333;
}

#app {
  min-height: 100vh;
  transform-origin: center center;
}



.animated-gradient {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: radial-gradient(
    circle at 50% 50%,
    #1a472a,      /* Темно-зеленый */
    #2a6230,      /* Зеленый */
    #3b7a3b,      /* Средне-зеленый */
    #4c8b4c,      /* Светло-зеленый */
    #5da55d,      /* Мятно-зеленый */
    #6eb96e,      /* Ярко-зеленый */
    #7fcd7f,      /* Салатовый */
    #90e090,      /* Очень светлый зеленый */
    #a0f0a0,      /* Почти белый зеленый */
    #90e0f0,      /* Голубой */
    #7fc0e0,      /* Небесный */
    #6fa0d0,      /* Синий */
    #5f80c0,      /* Темно-синий */
    #4f60b0,      /* Индиго */
    #6f4fa0,      /* Фиолетовый */
    #8f3f90,      /* Пурпурный */
    #af2f80,      /* Розово-фиолетовый */
    #cf1f70,      /* Розовый */
    #ef0f60,      /* Ярко-розовый */
    #ff0066,      /* Неоново-розовый */
    #1a472a       /* Возврат */
  );
  background-size: 600% 600%;
  animation: auroraFlow 30s ease infinite;
  filter: brightness(0.8);
  opacity: 0.9;
}

@keyframes auroraFlow {
  0% {
    background-position: 0% 0%;
    
  }
  25% {
    background-position: 100% 0%;
    
  }
  50% {
    background-position: 100% 100%;
    
  }
  75% {
    background-position: 0% 100%;
    
  }
  100% {
    background-position: 0% 0%;
  
  }
}

/* Хедер */
.header {
  background: linear-gradient(135deg, #2c3e50 0%, #4a6583 100%);
  color: white;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
}

.auth-status {
  display: flex;
  align-items: center;
  gap: 15px;
}

.auth-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.auth-btn:hover {
  background: #2980b9;
}

/* Основной контент */
.main {
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Не авторизован */
.not-authorized {
  text-align: center;
  padding: 100px 20px;
}

.not-authorized h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 28px;
}

.not-authorized p {
  color: #7f8c8d;
  margin-bottom: 30px;
  font-size: 18px;
}

.login-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.login-btn:hover {
  background: #2980b9;
}

/* Загрузка */
.loading {
  text-align: center;
  padding: 60px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Ошибка */
.error {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  color: #c33;
}

.retry-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
}

/* Таблица */
.mods-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 30px;
}

.mods-table {
  width: 100%;
  border-collapse: collapse;
}

.mods-table th {
  background: #f8f9fa;
  padding: 18px 20px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
  user-select: none;
}

.mods-table th.sortable {
  cursor: pointer;
  transition: background 0.2s;
}

.mods-table th.sortable:hover {
  background: #e9ecef;
}

.mods-table td {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: top;
}

.mods-table tbody tr {
  transition: background 0.2s;
}

.mods-table tbody tr:hover {
  background: #f8f9fa;
}

/* Аватарка в таблице */
.avatar-preview {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border: 2px solid #e0e0e0;
}

.mod-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-avatar {
  font-size: 24px;
  color: #999;
}

/* Ячейки */
.mod-title {
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 5px;
}

.mod-description {
  color: #6c757d;
  font-size: 14px;
  line-height: 1.5;
}

.downloads-cell {
  font-family: monospace;
  font-size: 15px;
  font-weight: 500;
  color: #2c3e50;
}

.clientside-yes {
  color: #27ae60;
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
}

.version-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.developer-tag {
  background: #f3e5f5;
  color: #7b1fa2;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.tag-tag {
  background: #f3e5f5;
  color: #7b1fa2;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.no-data {
  color: #95a5a6;
  font-size: 12px;
  font-style: italic;
}


.loader-tag {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.more-tag {
  background: #f5f5f5;
  color: #757575;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.actions-cell {
  white-space: nowrap;
}

.actions-cell button {
  background: none;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
  transition: background 0.2s;
  margin: 0 2px;
}

.btn-view:hover {
  background: #e3f2fd;
}

.btn-edit:hover {
  background: #fff3e0;
}

.btn-delete:hover {
  background: #ffebee;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 25px 30px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 30px;
}

.modal-section {
  margin-bottom: 30px;
}

.modal-section h3 {
  color: #495057;
  font-size: 18px;
  margin-bottom: 15px;
  font-weight: 600;
}

.modal-section p {
  color: #6c757d;
  line-height: 1.6;
}

/* Большая аватарка в модальном окне */
.mod-main-info {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
}

.mod-avatar-large {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
  border: 3px solid #ddd;
}

.mod-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-avatar-large {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #bbb;
}

.mod-description-full {
  flex: 1;
}

.mod-description-full h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.mod-description-full p {
  line-height: 1.6;
  color: #555;
}

/* Горизонтальное отображение статистики */
.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin: 25px 0;
}

.modal-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.modal-item strong {
  color: #495057;
  margin-bottom: 5px;
  font-size: 14px;
}

.modal-item span {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 500;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.loader-tag {
  background: #e8f5e9;
  color: #2e7d32;
}

.developer-tag {
  background: #f3e5f5;
  color: #7b1fa2;
}

/* Галерея */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.gallery-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  height: 150px;
  background: #f0f0f0;
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.gallery-item:hover img {
  transform: scale(1.05);
}

.gallery-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.gallery-item:hover .gallery-overlay {
  opacity: 1;
}

/* Источники скачивания */
.sources-list {
  margin-top: 15px;
}

.source-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  border-left: 4px solid #3498db;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.source-header h4 {
  margin: 0;
  color: #2c3e50;
}

.file-size {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.file-source,
.url-source {
  margin-bottom: 15px;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #2ecc71;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 10px;
  min-width: 140px;
  transition: background 0.2s;
}

.download-btn:hover:not(:disabled) {
  background: #27ae60;
}

.download-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.external-link {
  display: inline-block;
  color: #3498db;
  text-decoration: none;
  word-break: break-all;
  margin-top: 5px;
}

.external-link:hover {
  text-decoration: underline;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.source-versions,
.source-loaders {
  display: flex;
  align-items: center;
  gap: 8px;
}

.small-tag {
  background: #e9ecef;
  color: #495057;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.lightbox {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.lightbox img {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 8px;
}

.lightbox-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 36px;
  cursor: pointer;
}

.lightbox-info {
  text-align: center;
  color: white;
  margin-top: 15px;
}

/* Empty states */
.empty-message {
  color: #6c757d;
  font-style: italic;
  padding: 20px;
  text-align: center;
  background: #f8f9fa;
  border-radius: 8px;
}

/* Футер модального окна */
.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.btn-edit-large {
  background: #f39c12;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-edit-large:hover {
  background: #d68910;
}

.btn-close {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-close:hover {
  background: #7f8c8d;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fee;
  color: #c33;
  font-size: 12px;
}

@media (max-width: 768px) {
  .modal-grid {
    grid-template-columns: 1fr;
  }

  .mod-main-info {
    flex-direction: column;
  }

  .mod-avatar-large {
    width: 100%;
    height: 200px;
  }
}
</style>