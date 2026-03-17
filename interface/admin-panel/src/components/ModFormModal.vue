<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal large-modal">
      <div class="modal-header">
        <h2>{{ isEditMode ? 'Редактирование мода' : 'Добавление нового мода' }}</h2>
        <button @click="closeModal" class="modal-close">×</button>
      </div>

      <div class="modal-body">
        <!-- Сообщения об ошибках/успехе -->
        <div v-if="message" :class="['message', messageType]">
          {{ message }}
        </div>

        <!-- Основная форма -->
        <form @submit.prevent="submitForm">
          <!-- Основная информация -->
          <div class="form-section">
            <h3>📝 Основная информация</h3>

            <div class="form-grid">
              <div class="form-group">
                <label for="title">Название мода *</label>
                <input id="title" v-model="form.title" type="text" required placeholder="Например: OptiFine" />
              </div>

              <div class="form-group">
                <label for="size">Размер (МБ)</label>
                <input id="size" v-model="form.size" type="number" step="0.1" placeholder="Например: 2.5" />
              </div>

              <div class="form-group">
                <label for="downloads">Количество загрузок</label>
                <input id="downloads" v-model="form.downloads" type="number" placeholder="Например: 15000000" />
              </div>

              <div class="form-group">
                <label>
                  <input type="checkbox" v-model="form.isClientside" />
                  🖥️ Клиентский мод
                </label>
              </div>
            </div>

            <div class="form-group">
              <label for="description">Описание</label>
              <textarea id="description" v-model="form.description" rows="3"
                placeholder="Подробное описание мода..."></textarea>
            </div>
          </div>

          <!-- Изображение мода -->
          <div class="form-section">
            <h3>🖼️ Изображение мода</h3>

            <div class="image-upload-area">
              <div v-if="imagePreview" class="image-preview">
                <img :src="imagePreview" alt="Превью" />
                <button @click="removeImage" type="button" class="remove-image-btn">×</button>
              </div>

              <div v-else class="upload-placeholder" @click="triggerImageUpload">
                <span>Нажмите для загрузки изображения</span>
              </div>

              <input ref="imageInput" type="file" accept="image/*" @change="handleImageUpload" style="display: none" />

              <div v-if="existingImageUrl" class="existing-image-info">
                <small>Текущее изображение: {{ existingImageUrl.split('/').pop() }}</small>
              </div>
            </div>
          </div>

          <!-- Версии и загрузчики -->
          <div class="form-section">
            <h3>🎮 Версии и загрузчики *</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Версии Minecraft *</label>
                <div class="checkbox-list">
                  <label v-for="version in availableVersions" :key="version.id" class="checkbox-item">
                    <input type="checkbox" :value="version.id" v-model="form.versionIds" />
                    {{ version.title }}
                  </label>
                </div>
                <small v-if="!form.versionIds.length" class="error-text">Выберите хотя бы одну версию</small>
              </div>

              <div class="form-group">
                <label>Загрузчики модов *</label>
                <div class="checkbox-list">
                  <label v-for="loader in availableModLoaders" :key="loader.id" class="checkbox-item">
                    <input type="checkbox" :value="loader.id" v-model="form.modLoaderIds" />
                    {{ loader.title }}
                  </label>
                </div>
                <small v-if="!form.modLoaderIds.length" class="error-text">Выберите хотя бы один загрузчик</small>
              </div>
            </div>
          </div>

          <!-- Теги и разработчики -->
          <div class="form-section">
            <h3>🏷️ Теги и разработчики</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Теги</label>
                <div class="checkbox-list">
                  <label v-for="tag in availableTags" :key="tag.id" class="checkbox-item">
                    <input type="checkbox" :value="tag.id" v-model="form.tagIds" />
                    {{ tag.title }}
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label>Разработчики</label>
                <div class="checkbox-list">
                  <label v-for="developer in availableDevelopers" :key="developer.id" class="checkbox-item">
                    <input type="checkbox" :value="developer.id" v-model="form.developerIds" />
                    {{ developer.nickname }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Источники скачивания -->
          <div class="form-section">
            <h3>📥 Источники скачивания</h3>
            <DownloadSources ref="downloadSources" :mod-id="modId" :initial-sources="initialSources"
              :available-versions="availableVersions" :available-mod-loaders="availableModLoaders" />
          </div>

          <!-- Галерея изображений -->
          <div class="form-section">
            <h3>📸 Галерея изображений</h3>
            <GalleryUpload ref="galleryUpload" :mod-id="modId" :initial-gallery="initialGallery" />
          </div>

          <!-- Кнопки формы -->
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">
              Отмена
            </button>
            <button type="submit" :disabled="loading" class="btn-submit">
              <span v-if="loading" class="spinner-small"></span>
              <span v-else>{{ isEditMode ? 'Сохранить изменения' : 'Добавить мод' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import DownloadSources from './DownloadSources.vue'
import GalleryUpload from './GalleryUpload.vue'
import { modsApi, filesApi, referencesApi, galleriesApi, sourcesApi } from '../api.js'

export default {
  name: 'ModFormModal',

  components: {
    DownloadSources,
    GalleryUpload
  },

  props: {
    mod: {
      type: Object,
      default: null
    }
  },

  data() {
    return {
      loading: false,
      message: '',
      messageType: '',

      // Форма
      form: {
        title: '',
        description: '',
        size: 0,
        downloads: 0,
        isClientside: false,
        versionIds: [],
        modLoaderIds: [],
        tagIds: [],
        developerIds: []
      },

      // Изображение
      imageFile: null,
      imagePreview: null,
      existingImageUrl: null,

      // Справочные данные
      availableVersions: [],
      availableModLoaders: [],
      availableTags: [],
      availableDevelopers: [],

      // Для редактирования
      initialSources: [],
      initialGallery: []
    }
  },

  computed: {
    isEditMode() {
      return !!this.mod
    },

    modId() {
      return this.mod?.id || null
    }
  },

  mounted() {
    this.loadReferenceData()
    if (this.isEditMode) {
      this.prefillForm()
    }
  },

  methods: {
    // ✅ Исправлено: используем referencesApi для загрузки справочных данных
    async loadReferenceData() {
      try {
        // ✅ Используем API методы вместо прямых fetch
        const [versions, loaders, tags, developers] = await Promise.all([
          referencesApi.getVersions(),
          referencesApi.getModLoaders(),
          referencesApi.getTags(),
          referencesApi.getDevelopers()
        ])

        this.availableVersions = versions
        this.availableModLoaders = loaders
        this.availableTags = tags
        this.availableDevelopers = developers

      } catch (error) {
        console.error('Ошибка загрузки справочных данных:', error)
        this.showMessage('Ошибка загрузки данных', 'error')
      }
    },

    // ✅ Исправлено: используем API методы для предзаполнения формы
    async prefillForm() {
      try {
        console.log(`🔍 Предзаполняем форму для мода ${this.mod.id}`)

        // Основные данные
        this.form = {
          title: this.mod.title || '',
          description: this.mod.description || '',
          size: this.mod.size || 0,
          downloads: this.mod.downloads || 0,
          isClientside: this.mod.isClientside || false,
          versionIds: this.mod.versions?.map(v => v.id) || [],
          modLoaderIds: this.mod.modLoaders?.map(ml => ml.id) || [],
          tagIds: this.mod.tags?.map(t => t.id) || [],
          developerIds: this.mod.developers?.map(d => d.id) || []
        }

        console.log('📝 Основные данные загружены:', this.form)

        // Изображение
        if (this.mod.imageUrl) {
          this.existingImageUrl = this.mod.imageUrl
          this.imagePreview = `http://localhost:5126${this.mod.imageUrl}`
          console.log(`🖼️ Аватарка мода: ${this.imagePreview}`)
        }

        // 🔥 ПАРАЛЛЕЛЬНАЯ ЗАГРУЗКА ГАЛЕРЕИ И ИСТОЧНИКОВ через API
        console.log('📥 Загружаем галерею и источники...')

        const [sourcesResult, galleryResult] = await Promise.allSettled([
          sourcesApi.getByModId(this.mod.id),
          galleriesApi.getByModId(this.mod.id)
        ])

        // Источники скачивания
        if (sourcesResult.status === 'fulfilled') {
          this.initialSources = sourcesResult.value || []
          console.log(`📦 Загружено источников: ${this.initialSources.length}`)
        } else {
          console.warn('⚠️ Не удалось загрузить источники:', sourcesResult.reason)
          this.initialSources = []
        }

        // Галерея
        if (galleryResult.status === 'fulfilled') {
          this.initialGallery = galleryResult.value || []
          console.log(`📸 Загружено изображений галереи: ${this.initialGallery.length}`)

          // Логируем URL изображений
          this.initialGallery.forEach((img, index) => {
            console.log(`   ${index + 1}. ${img.imageUrl} (${img.fileName})`)
          })
        } else {
          console.warn('⚠️ Не удалось загрузить галерею:', galleryResult.reason)
          this.initialGallery = []
        }

      } catch (error) {
        console.error('❌ Ошибка предзаполнения формы:', error)
        this.showMessage('Ошибка загрузки данных мода', 'error')
      }
    },
    
    // Обработка загрузки изображения
    triggerImageUpload() {
      this.$refs.imageInput.click()
    },

    handleImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      this.imageFile = file

      // Создаем preview
      const reader = new FileReader()
      reader.onload = (e) => {
        this.imagePreview = e.target.result
        this.existingImageUrl = null // Сбрасываем старое изображение
      }
      reader.readAsDataURL(file)
    },

    removeImage() {
      this.imageFile = null
      this.imagePreview = null
      this.existingImageUrl = null
      this.$refs.imageInput.value = ''
    },

    // ✅ Исправлено: используем filesApi для загрузки изображения
    async uploadImage() {
      if (!this.imageFile) return null

      try {
        // ✅ Используем API метод
        return await filesApi.uploadImage(this.imageFile)

      } catch (error) {
        console.error('Ошибка загрузки изображения:', error)
        throw error
      }
    },

    // ✅ Исправлено: используем filesApi для удаления изображения
    async deleteOldImage() {
      if (!this.existingImageUrl) return

      try {
        const fileName = this.existingImageUrl.split('/').pop()
        // ✅ Используем API метод
        await filesApi.deleteImage(fileName)

      } catch (error) {
        console.error('Ошибка удаления старого изображения:', error)
        // Не прерываем выполнение из-за этой ошибки
      }
    },

    // Валидация формы
    validateForm() {
      if (!this.form.title.trim()) {
        this.showMessage('Введите название мода', 'error')
        return false
      }

      if (this.form.versionIds.length === 0) {
        this.showMessage('Выберите хотя бы одну версию Minecraft', 'error')
        return false
      }

      if (this.form.modLoaderIds.length === 0) {
        this.showMessage('Выберите хотя бы один загрузчик модов', 'error')
        return false
      }

      return true
    },

    // ✅ Упрощенный submitForm (убраны лишние методы)
    async submitForm() {
      if (!this.validateForm()) return;
      
      this.loading = true;
      this.message = '';
      
      try {
        // 1. Изображение
        let imageUrl = null;
        if (this.imageFile) {
          // ✅ Используем API метод
          imageUrl = await filesApi.uploadImage(this.imageFile);
          
          // Удаляем старое если есть
          if (this.isEditMode && this.existingImageUrl) {
            const fileName = this.existingImageUrl.split('/').pop();
            // ✅ Используем API метод
            await filesApi.deleteImage(fileName);
          }
        } else if (this.isEditMode && !this.existingImageUrl && this.mod.imageUrl) {
          // Пользователь удалил изображение
          const fileName = this.mod.imageUrl.split('/').pop();
          // ✅ Используем API метод
          await filesApi.deleteImage(fileName);
        } else if (this.existingImageUrl) {
          imageUrl = this.existingImageUrl;
        }
        
        // 2. Данные мода
        const modData = {
          ...this.form,
          updatedAt: new Date().toISOString()
        };
        
        if (!this.isEditMode) {
          modData.createdAt = new Date().toISOString();
        }
        
        if (imageUrl !== null) {
          modData.imageUrl = imageUrl;
        }
        
        // 3. Сохраняем мод через API
        let createdModId = this.modId;
        
        if (this.isEditMode) {
          // ✅ Используем API метод
          await modsApi.update(createdModId, modData);
        } else {
          // ✅ Используем API метод
          const result = await modsApi.create(modData);
          createdModId = result.id;
        }
        
        // 4. Обрабатываем источники (если есть)
        if (this.$refs.downloadSources) {
          await this.$refs.downloadSources.processSources(createdModId);
        }
        
        // 5. Обрабатываем галерею (если есть)
        if (this.$refs.galleryUpload) {
          await this.$refs.galleryUpload.processGallery(createdModId);
        }
        
        // Успех
        this.showMessage(
          this.isEditMode ? 'Мод успешно обновлен!' : 'Мод успешно добавлен!',
          'success'
        );
        
        setTimeout(() => {
          this.$emit('saved', createdModId);
          this.closeModal();
        }, 2000);
        
      } catch (error) {
        this.showMessage(`Ошибка: ${error.message}`, 'error');
      } finally {
        this.loading = false;
      }
    },

    // ❌ УДАЛЯЕМ эти лишние методы, так как они уже есть в api.js
    // async createMod(modData) { ... }
    // async updateMod(modId, modData) { ... }

    // Показать сообщение
    showMessage(text, type) {
      this.message = text
      this.messageType = type

      if (type === 'success') {
        setTimeout(() => {
          this.message = ''
        }, 3000)
      }
    },

    // Закрыть модальное окно
    closeModal() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.large-modal {
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2c3e50;
  color: white;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 30px;
  background: #f8f9fa;
}

.message {
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.form-section {
  background: white;
  border-radius: 10px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 18px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: 95%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.checkbox-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px;
  background: #f8f9fa;
}

.checkbox-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.checkbox-item:hover {
  background: #e9ecef;
}

.checkbox-item input {
  margin-right: 10px;
}

.error-text {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

/* Изображение */
.image-upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
  background: #f8f9fa;
}

.image-upload-area:hover {
  border-color: #3498db;
}

.upload-placeholder {
  color: #6c757d;
  font-size: 16px;
}

.image-preview {
  position: relative;
  display: inline-block;
  max-width: 300px;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 6px;
  border: 2px solid #ddd;
}

.remove-image-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #e74c3c;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}

.existing-image-info {
  margin-top: 10px;
  color: #6c757d;
  font-size: 14px;
}

/* Кнопки формы */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  margin-top: 30px;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-cancel:hover {
  background: #7f8c8d;
}

.btn-submit {
  background: #2ecc71;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-submit:hover:not(:disabled) {
  background: #27ae60;
}

.btn-submit:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .large-modal {
    width: 95%;
    padding: 10px;
  }

  .modal-body {
    padding: 15px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>