<template>
  <div v-if="mod" class="modal-overlay active" @click.self="$emit('close')">
    <div class="modal-content modal-mod-details">
      <div class="modal-header">
        <p>{{ mod.title }}</p>
        <button @click="$emit('close')" class="modal-close">×</button>
      </div>

      <div class="mod-details-content">
        <!-- Основная информация -->
        <div class="mod-details-header">
          <div class="mod-details-image">
            <img 
              v-if="mod.imageUrl" 
              :src="getFullImageUrl(mod.imageUrl)" 
              :alt="mod.title"
              @error="handleImageError" 
            />
            <div v-else class="no-avatar-large">🖼️ Нет аватарки</div>
          </div>

          <div class="mod-details-info">
            <div class="mod-details-description-container">
              <h3 class="mod-details-section-title">Описание</h3>
              <p class="mod-details-description">
                {{ mod.description || 'Нет описания' }}
              </p>
            </div>

            <!-- Статистика -->
            <div class="mod-details-grid">
              <div class="mod-details-stat">
                <div class="mod-details-stat-value">{{ formatNumber(mod.downloads) }}</div>
                <div class="mod-details-stat-label">Загрузки</div>
              </div>
              <div class="mod-details-stat">
                <div class="mod-details-stat-value">{{ mod.size || '0' }} MB</div>
                <div class="mod-details-stat-label">Размер</div>
              </div>
              <div class="mod-details-stat">
                <div class="mod-details-stat-value">
                  {{ mod.isClientside ? 'Клиент' : 'Сервер' }}
                </div>
                <div class="mod-details-stat-label">Тип</div>
              </div>
              <div class="mod-details-stat">
                <div class="mod-details-stat-value">
                  {{ formatDate(mod.createdAt) }}
                </div>
                <div class="mod-details-stat-label">Создан</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Теги, версии, разработчики -->
        <div class="mod-details-sections">
          <!-- Версии -->
          <div v-if="mod.versions && mod.versions.length" class="mod-details-section">
            <h3 class="mod-details-section-title">🎮 Версии Minecraft</h3>
            <div class="mod-details-tags-container">
              <span 
                v-for="version in mod.versions" 
                :key="version.id" 
                class="mod-details-version"
              >
                {{ version.title }}
              </span>
            </div>
          </div>

          <!-- Загрузчики -->
          <div v-if="mod.modLoaders && mod.modLoaders.length" class="mod-details-section">
            <h3 class="mod-details-section-title">⚙️ Загрузчики модов</h3>
            <div class="mod-details-loaders-container">
              <span 
                v-for="loader in mod.modLoaders" 
                :key="loader.id" 
                class="mod-details-loader"
              >
                {{ loader.title }}
              </span>
            </div>
          </div>

          <!-- Теги -->
          <div v-if="mod.tags && mod.tags.length" class="mod-details-section">
            <h3 class="mod-details-section-title">🏷️ Теги</h3>
            <div class="mod-details-tags-container">
              <span 
                v-for="tag in mod.tags" 
                :key="tag.id" 
                class="mod-details-tag"
              >
                {{ tag.title }}
              </span>
            </div>
          </div>

          <!-- Разработчики -->
          <div v-if="mod.developers && mod.developers.length" class="mod-details-section">
            <h3 class="mod-details-section-title">👨‍💻 Разработчики</h3>
            <div class="mod-details-developers-container">
              <span 
                v-for="developer in mod.developers" 
                :key="developer.id" 
                class="mod-details-developer"
              >
                {{ developer.nickname }}
              </span>
            </div>
          </div>

          <!-- Источники скачивания -->
          <div v-if="downloadSources.length > 0" class="mod-details-section">
            <h3 class="mod-details-section-title">📥 Источники скачивания</h3>
            <div class="download-sources-list">
              <div 
                v-for="source in downloadSources" 
                :key="source.id" 
                class="download-source-item"
              >
                <div class="source-header">
                  <h4>{{ source.title }}</h4>
                  <span v-if="source.fileSize" class="file-size">
                    {{ formatFileSize(source.fileSize) }}
                  </span>
                </div>

                <!-- Ссылка для скачивания -->
                <div class="source-actions">
                  <button 
                    v-if="source.filePath" 
                    @click="downloadFile(source)" 
                    class="btn btn-success btn-download"
                    :disabled="downloadingFiles[source.id]"
                  >
                    <span v-if="downloadingFiles[source.id]" class="spinner-small"></span>
                    <span v-else>📥 Скачать файл</span>
                  </button>
                  
                  <a 
                    v-if="source.url" 
                    :href="source.url" 
                    target="_blank" 
                    class="btn btn-primary"
                  >
                    🔗 Открыть ссылку
                  </a>
                </div>

                <!-- Версии и загрузчики -->
                <div v-if="source.versions && source.versions.length" class="source-tags">
                  <strong>Версии:</strong>
                  <span 
                    v-for="version in source.versions" 
                    :key="version.id" 
                    class="small-tag"
                  >
                    {{ version.title }}
                  </span>
                </div>

                <div v-if="source.modLoaders && source.modLoaders.length" class="source-tags">
                  <strong>Загрузчики:</strong>
                  <span 
                    v-for="loader in source.modLoaders" 
                    :key="loader.id" 
                    class="small-tag loader-tag"
                  >
                    {{ loader.title }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Галерея изображений -->
          <div v-if="galleryImages.length > 0" class="mod-details-section">
            <h3 class="mod-details-section-title">📸 Галерея</h3>
            <div class="gallery-grid">
              <div 
                v-for="image in galleryImages" 
                :key="image.id" 
                class="gallery-item"
                @click="openGalleryModal(image)"
              >
                <img 
                  :src="getFullImageUrl(image.imageUrl)" 
                  :alt="image.fileName"
                  @error="handleImageError" 
                />
                <div class="gallery-item-name">{{ image.fileName }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Кнопки действий -->
        <div class="mod-details-actions">
          <button @click="$emit('close')" class="btn btn-secondary">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Модальное окно галереи -->
  <div v-if="galleryModalImage" class="gallery-modal" style="display: block;">
    <div class="gallery-modal-background" @click="closeGalleryModal"></div>
    <div class="gallery-modal-content">
      <span class="gallery-modal-close" @click="closeGalleryModal">&times;</span>
      <img 
        class="gallery-modal-image" 
        :src="getFullImageUrl(galleryModalImage.imageUrl)" 
        :alt="galleryModalImage.fileName"
      />
      <div class="gallery-modal-caption">{{ galleryModalImage.fileName }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { sourcesApi, galleriesApi, filesApi } from '@/api/index'

const props = defineProps({
  mod: Object
})

const emit = defineEmits(['close'])

const galleryImages = ref([])
const downloadSources = ref([])
const galleryModalImage = ref(null)
const downloadingFiles = ref({})
const loading = ref({
  gallery: false,
  sources: false
})

// Загрузка дополнительных данных
onMounted(async () => {
  if (props.mod?.id) {
    await loadModDetails(props.mod.id)
  }
})

watch(() => props.mod, async (newMod) => {
  if (newMod?.id) {
    await loadModDetails(newMod.id)
  }
})

const loadModDetails = async (modId) => {
  try {
    loading.value.gallery = true
    loading.value.sources = true

    const [gallery, sources] = await Promise.all([
      galleriesApi.getByModId(modId),
      sourcesApi.getByModId(modId)
    ])

    galleryImages.value = Array.isArray(gallery) ? gallery : []
    downloadSources.value = Array.isArray(sources) ? sources : []

  } catch (error) {
    console.error('❌ Ошибка загрузки деталей:', error)
    galleryImages.value = []
    downloadSources.value = []
  } finally {
    loading.value.gallery = false
    loading.value.sources = false
  }
}

// Скачивание файла
const downloadFile = async (source) => {
  try {
    downloadingFiles.value[source.id] = true

    const fileName = extractFileNameFromPath(source)
    const blob = await filesApi.downloadModFile(fileName)

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = source.fileName || fileName

    document.body.appendChild(a)
    a.click()

    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    console.log('✅ Файл успешно скачан:', fileName)

  } catch (error) {
    console.error('❌ Ошибка скачивания файла:', error)
    alert('❌ Ошибка при скачивании файла: ' + error.message)
  } finally {
    downloadingFiles.value[source.id] = false
  }
}

// Извлечение имени файла
const extractFileNameFromPath = (source) => {
  if (source.filePath) {
    return source.filePath.split('/').pop()
  }
  if (source.fileName) {
    return source.fileName
  }
  return `${source.id}.jar`
}

// Галерея
const openGalleryModal = (image) => {
  galleryModalImage.value = image
}

const closeGalleryModal = () => {
  galleryModalImage.value = null
}

// Утилиты
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

const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return new Intl.NumberFormat('ru-RU').format(num)
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Б'
  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

const formatDate = (dateString) => {
  if (!dateString) return 'Нет даты'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
/* Стили модального окна из вашего CSS */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
  padding: 40px 20px;
  overflow-y: auto;
}

.modal-overlay.active {
  opacity: 1;
}

.modal-content {
  background: 
    linear-gradient(180deg, rgba(2, 0, 15, 0.8), rgba(25, 16, 0, 0.8)),
    url("/images/blocks/basalt_side.png") center/64px;
  image-rendering: pixelated;
  position: relative;
  border: 4px solid black;
  padding: 0;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  transform: translateY(-20px);
  transition: transform 0.3s ease;
}

.modal-content:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    url("/images/blocks/blackstone_decoration1.png") 30% 6%/200px no-repeat,
    url("/images/blocks/blackstone_decoration2.png") 85% 22%/250px no-repeat,
    url("/images/blocks/ancient_debris_decoration3.png") 45% 36%/280px no-repeat;
  image-rendering: pixelated;
  pointer-events: none;
  z-index: -1;
  filter: brightness(0.2) drop-shadow(0 0 100px rgba(0,0,0,1));
}

.modal-overlay.active .modal-content {
  transform: translateY(0);
}

.modal-header {
  background: 
    linear-gradient(0deg, rgba(43, 27, 0, 0.2), rgba(16, 0, 56, 0.4)),
    url("/images/blocks/bedrock.png") center/64px;
  image-rendering: pixelated;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 4px solid black;
  flex-shrink: 0;
}

.modal-header p {
  color: white;
  margin: 0;
  font-size: 2rem;
  text-shadow: 0 5px 0 black;
}

.modal-close {
  background: none;
  border: none;
  color: white;
  text-shadow: 0 5px 0 black;
  font-size: 3.5rem;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.modal-close:hover {
  color: #ff4500;
  transform: scale(1.2);
}

/* Контент деталей мода */
.mod-details-content {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  overflow-y: auto;
}

.mod-details-header {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.mod-details-image {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.5);
  border: 4px solid black;
  box-shadow: 0 6px 0 black;
  flex-shrink: 0;
}

.mod-details-image img {
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
  color: #666;
}

.mod-details-info {
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mod-details-description-container {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  border-left: 4px solid #ff4500;
  padding: 20px;
}

.mod-details-section-title {
  color: white;
  font-size: 1.5rem;
  margin: 0 0 15px 0;
  text-shadow: 0 3px 0 black;
}

.mod-details-description {
  color: #ccc;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}

/* Статистика */
.mod-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.mod-details-stat {
  background: url("/images/blocks/soulsand_card.png");
  background-size: 100% 100%;
  padding: 25px 15px 15px 15px;
  text-align: center;
  transition: all 0.3s ease;
  border: 3px solid black;
  box-shadow: 0 6px 0 black;
}

.mod-details-stat:hover {
  transform: scale(1.05);
}

.mod-details-stat-value {
  font-size: 1.8rem;
  color: #ff4500;
  margin-bottom: 8px;
  text-shadow: 0 3px 0 black;
  font-weight: bold;
}

.mod-details-stat-label {
  font-size: 0.9rem;
  color: #ccc;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Секции */
.mod-details-sections {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.mod-details-section {
  background:
    url("/images/blocks/chiseled_nether_bricks.png") repeat-y right/64px,
    url("/images/blocks/nether_bricks.png") top/64px;
  border: 4px solid black;
  box-shadow: 0 6px 0 black;
  padding: 20px;
  border-radius: 8px;
}

/* Теги, версии, загрузчики */
.mod-details-tags-container,
.mod-details-loaders-container,
.mod-details-developers-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.mod-details-tag,
.mod-details-loader,
.mod-details-version,
.mod-details-developer {
  padding: 8px 16px;
  font-size: 1rem;
  border: 3px solid black;
  box-shadow: 0 6px 0 black;
  transition: all 0.3s ease;
}

.mod-details-tag:hover,
.mod-details-loader:hover,
.mod-details-version:hover,
.mod-details-developer:hover {
  transform: scale(1.1);
}

.mod-details-tag {
  background:
    linear-gradient(0, rgba(0, 255, 255, 1), rgba(0, 0, 0, 0)),
    url("/images/blocks/ice.png") center/64px;
  color: black;
}

.mod-details-loader {
  background:
    linear-gradient(0, rgba(255, 255, 0, 1), rgba(0, 0, 0, 0)),
    url("/images/blocks/red_sand.png") center/64px;
  color: black;
}

.mod-details-version {
  background:
    linear-gradient(0, rgba(0, 255, 0, 1), rgba(0, 0, 0, 0)),
    url("/images/blocks/moss_block.png") center/64px;
  color: black;
}

.mod-details-developer {
  background:
    linear-gradient(0, rgba(175, 51, 255, 1), rgba(0, 0, 0, 0)),
    url("/images/blocks/amethyst_block.png") center/64px;
  color: black;
}

/* Источники скачивания */
.download-sources-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.download-source-item {
  background:
    linear-gradient(0, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url("/images/blocks/orange_wool.png") center/64px;
  border: 4px solid black;
  box-shadow: 0 6px 0 black;
  padding: 20px;
  border-radius: 8px;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.source-header h4 {
  margin: 0;
  color: white;
  font-size: 1.3rem;
  text-shadow: 0 3px 0 black;
}

.file-size {
  background: rgba(0, 255, 255, 0.2);
  color: #00ffff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  border: 2px solid #00ffff;
}

.source-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.btn-download {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.source-tags strong {
  color: #ccc;
  font-size: 0.9rem;
}

.small-tag {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  border: 1px solid #666;
}

.loader-tag {
  background: rgba(255, 255, 0, 0.2);
  color: #ffff00;
  border-color: #ffff00;
}

/* Галерея */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.gallery-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.3);
  border: 3px solid black;
  transition: all 0.3s ease;
}

.gallery-item:hover {
  transform: scale(1.05);
  border-color: white;
  box-shadow: 0 0 15px rgba(255, 69, 0, 0.5);
}

.gallery-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.gallery-item-name {
  font-size: 0.7rem;
  padding: 5px;
  text-align: center;
  color: #ccc;
  background: rgba(0, 0, 0, 0.7);
}

/* Кнопки действий */
.mod-details-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

/* Адаптивность */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 20px 10px;
  }

  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .mod-details-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .mod-details-image {
    width: 150px;
    height: 150px;
  }

  .mod-details-info {
    min-width: 100%;
  }

  .mod-details-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .source-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .modal-header {
    padding: 15px 20px;
  }

  .modal-header p {
    font-size: 1.5rem;
  }

  .mod-details-content {
    padding: 15px;
  }

  .mod-details-grid {
    grid-template-columns: 1fr;
  }

  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>