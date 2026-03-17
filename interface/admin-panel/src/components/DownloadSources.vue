<template>
  <div class="download-sources">
    <div class="sources-header">
      <h4>Добавьте файлы или ссылки для скачивания</h4>
      <button @click="addSource" type="button" class="btn-add-source">
        + Добавить источник
      </button>
    </div>
    
    <div class="sources-list">
      <div v-for="(source, index) in sources" :key="source.id" class="source-item" :data-id="source.id">
        <div class="source-header">
          <span class="source-number">#{{ index + 1 }}</span>
          <button @click="removeSource(source.id)" type="button" class="btn-remove-source">
            × Удалить
          </button>
        </div>
        
        <!-- Название источника -->
        <div class="form-group">
          <label>Название источника</label>
          <input
            v-model="source.title"
            type="text"
            placeholder="Например: Основной файл"
          />
        </div>
        
        <!-- Версии для этого источника -->
        <div class="form-group">
          <label>Версии для этого файла *</label>
          <div class="checkbox-list compact">
            <label v-for="version in availableVersions" :key="version.id" class="checkbox-item">
              <input
                type="checkbox"
                :value="version.id"
                v-model="source.versionIds"
                @change="updateSelectionCount(source.id, 'version')"
              />
              {{ version.title }}
            </label>
          </div>
          <small v-if="!source.versionIds.length" class="error-text">Выберите хотя бы одну версию</small>
        </div>
        
        <!-- Загрузчики для этого источника -->
        <div class="form-group">
          <label>Загрузчики для этого файла *</label>
          <div class="checkbox-list compact">
            <label v-for="loader in availableModLoaders" :key="loader.id" class="checkbox-item">
              <input
                type="checkbox"
                :value="loader.id"
                v-model="source.modLoaderIds"
                @change="updateSelectionCount(source.id, 'modloader')"
              />
              {{ loader.title }}
            </label>
          </div>
          <small v-if="!source.modLoaderIds.length" class="error-text">Выберите хотя бы один загрузчик</small>
        </div>
        
        <!-- Тип источника -->
        <div class="source-type">
          <div class="type-tabs">
            <button
              type="button"
              :class="['type-tab', source.displayType === 'url' ? 'active' : '']"
              @click="setSourceType(source.id, 'url')"
            >
              🔗 Ссылка
            </button>
            <button
              type="button"
              :class="['type-tab', source.displayType === 'file' ? 'active' : '']"
              @click="setSourceType(source.id, 'file')"
            >
              📁 Файл
            </button>
          </div>
          
          <!-- URL поле -->
          <div v-if="source.displayType === 'url'" class="url-source">
            <input
              v-model="source.url"
              type="url"
              placeholder="https://example.com/download/mod.jar"
            />
            <small class="hint">Внешняя ссылка для скачивания</small>
          </div>
          
          <!-- Файл -->
          <div v-else class="file-source">
            <!-- 🔥 ОТОБРАЖАЕМ ОРИГИНАЛЬНОЕ ИМЯ -->
            <div v-if="source.displayFileName || source.filePath" class="existing-file">
              <p><strong>Текущий файл:</strong> {{ source.displayFileName || 'файл из БД' }}</p>
              <small v-if="source.fileSize">Размер: {{ formatFileSize(source.fileSize) }}</small>
              
              <!-- Предупреждения -->
              <small v-if="source.versionsChanged || source.loadersChanged" class="warning-text">
                ⚠️ При сохранении файл будет переименован
              </small>
              <small v-if="source.newFile" class="warning-text">
                ⚠️ Старый файл будет удален с сервера
              </small>
            </div>
            
            <div class="file-input">
              <input
                :ref="'fileInput_' + source.id"
                type="file"
                accept=".jar,.zip,.rar,.7z"
                @change="handleFileUpload($event, source.id)"
                style="display: none"
              />
              <button @click="triggerFileInput(source.id)" type="button" class="btn-file">
                {{ source.displayFileName || source.filePath ? 'Заменить файл' : 'Выбрать файл' }}
              </button>
              <span v-if="source.newFile?.name" class="file-name">{{ source.newFile.name }}</span>
              <span v-else-if="source.displayFileName" class="file-name">{{ source.displayFileName }}</span>
            </div>
            
            <!-- Информация о новом файле -->
            <div v-if="source.newFile" class="file-info new-file">
              <small>Будет загружен: {{ source.newFile.name }} ({{ formatFileSize(source.newFile.size) }})</small>
              <small v-if="source.displayFileName" class="warning-text">
                ⚠️ Старый файл "{{ source.displayFileName }}" будет удален
              </small>
            </div>
            
            <!-- Информация о существующем файле -->
            <div v-if="source.filePath && !source.newFile" class="file-info db-file">
              <small>📎 Файл в БД: {{ source.displayFileName || source.fileName }}</small>
              <br>
              <small style="color: #f39c12;">⚠️ Для изменения файла выберите новый</small>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="sources.length === 0" class="empty-sources">
      <p>Нет источников скачивания. Добавьте хотя бы один.</p>
    </div>
  </div>
</template>

<script>
import { filesApi, sourcesApi } from '../api.js'

export default {
  name: 'DownloadSources',
  
  props: {
    modId: {
      type: String,
      default: null
    },
    initialSources: {
      type: Array,
      default: () => []
    },
    availableVersions: {
      type: Array,
      default: () => []
    },
    availableModLoaders: {
      type: Array,
      default: () => []
    }
  },
  
  data() {
    return {
      sources: [],
      downloadSourceFiles: {}
    }
  },
  
  mounted() {
    if (this.initialSources.length > 0) {
      this.loadExistingSources()
    }
  },
  
  watch: {
    modId: {
      immediate: true,
      handler(newModId) {
        if (newModId && this.initialSources.length > 0) {
          this.loadExistingSources()
        }
      }
    },
    
    initialSources: {
      immediate: true,
      handler(newSources) {
        if (newSources && newSources.length > 0) {
          setTimeout(() => {
            this.loadExistingSources()
          }, 100)
        }
      }
    }
  },

  methods: {
    // 🔥 ЗАГРУЗКА ИСТОЧНИКОВ С КЭШИРОВАНИЕМ ОРИГИНАЛЬНЫХ ИМЕН
    loadExistingSources() {
      console.log('🔄 Загрузка существующих источников')
      
      if (!this.initialSources || this.initialSources.length === 0) {
        this.sources = []
        return
      }
      
      // 🔥 Кэш оригинальных имен (чтобы сохранить между обновлениями)
      const nameCache = JSON.parse(localStorage.getItem('downloadSourceNames') || '{}')
      
      this.sources = this.initialSources.map((source, index) => {
        // 🔥 Определяем имя для отображения:
        // 1. Из кэша localStorage
        // 2. Из поля fileName (если это не системное имя)
        // 3. Берем из filePath и пробуем восстановить оригинальное имя
        let displayFileName = nameCache[source.id] || source.fileName
        
        // 🔥 Проверяем, является ли fileName системным именем
        // Системные имена выглядят как: "1_4_8_neoforge_019c1e1b.zip"
        const isSystemName = /^[\w\d_-]+_\w+_\w{8}\.\w+$/.test(source.fileName || '')
        
        if (!displayFileName || isSystemName) {
          // Пытаемся получить оригинальное имя из других источников
          if (source.originalFileName) {
            displayFileName = source.originalFileName
          } else if (source.fileName && !isSystemName) {
            displayFileName = source.fileName
          } else {
            // Используем имя из пути как fallback
            displayFileName = source.filePath ? source.filePath.split('/').pop() : 'Неизвестный файл'
          }
        }
        
        // Сохраняем в кэш если нужно
        if (displayFileName && !nameCache[source.id]) {
          nameCache[source.id] = displayFileName
          localStorage.setItem('downloadSourceNames', JSON.stringify(nameCache))
        }
        
        const hasFileInDb = !!(source.filePath || source.fileName)
        const displayType = hasFileInDb ? 'file' : 'url'
        
        // 🔥 Определяем системное имя файла
        let serverFileName = null;
        if (source.filePath) {
          serverFileName = source.filePath.split('/').pop();
        }
        
        return {
          id: source.id,
          title: source.title || `Источник скачивания`,
          displayType: displayType,
          url: source.url || '',
          filePath: source.filePath || null,
          fileName: source.fileName || null, // имя из БД (может быть системным)
          displayFileName: displayFileName, // 🔥 имя для отображения пользователю
          serverFileName: serverFileName, // системное имя для операций
          fileSize: source.fileSize || null,
          newFile: null,
          // Оригинальные данные
          originalVersionIds: source.versions?.map(v => v.id) || [],
          originalModLoaderIds: source.modLoaders?.map(ml => ml.id) || [],
          // Текущие данные
          versionIds: source.versions?.map(v => v.id) || [],
          modLoaderIds: source.modLoaders?.map(ml => ml.id) || [],
          // Флаги изменений
          fileChanged: false,
          versionsChanged: false,
          loadersChanged: false,
          // Старый файл для удаления
          oldFileToDelete: null
        }
      })
      
      console.log('✅ Источники загружены:', this.sources.map(s => ({
        title: s.title,
        displayFileName: s.displayFileName,
        serverFileName: s.serverFileName
      })))
    },
    
    addSource() {
      const sourceId = 'temp_' + Date.now() + '_' + Math.random()
      const newSource = {
        id: sourceId,
        title: '',
        displayType: 'url',
        url: '',
        filePath: null,
        fileName: null,
        displayFileName: null,
        serverFileName: null,
        fileSize: null,
        newFile: null,
        originalVersionIds: [],
        originalModLoaderIds: [],
        versionIds: [],
        modLoaderIds: [],
        fileChanged: false,
        versionsChanged: false,
        loadersChanged: false,
        oldFileToDelete: null
      }
      
      this.sources.push(newSource)
    },
    
    setSourceType(sourceId, type) {
      const source = this.sources.find(s => s.id === sourceId)
      if (source) {
        source.displayType = type
      }
    },
    
    updateSelectionCount(sourceId, type) {
      const source = this.sources.find(s => s.id === sourceId)
      if (source) {
        if (type === 'version') {
          source.versionsChanged = this.arraysDiffer(source.versionIds, source.originalVersionIds)
        } else if (type === 'modloader') {
          source.loadersChanged = this.arraysDiffer(source.modLoaderIds, source.originalModLoaderIds)
        }
      }
    },
    
    arraysDiffer(arr1, arr2) {
      if (arr1.length !== arr2.length) return true
      const sorted1 = [...arr1].sort()
      const sorted2 = [...arr2].sort()
      return !sorted1.every((value, index) => value === sorted2[index])
    },
    
    triggerFileInput(sourceId) {
      this.$refs['fileInput_' + sourceId][0].click()
    },
    
    handleFileUpload(event, sourceId) {
      const file = event.target.files[0]
      if (!file) return
      
      console.log('📁 Выбран файл:', {
        sourceId: sourceId,
        name: file.name,
        size: file.size
      })
      
      const allowedExtensions = ['.jar', '.zip', '.rar', '.7z']
      const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      
      if (!allowedExtensions.includes(fileExt)) {
        alert(`Неподдерживаемый формат файла. Разрешены: ${allowedExtensions.join(', ')}`)
        return
      }
      
      if (file.size > 200 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 200MB')
        return
      }
      
      this.downloadSourceFiles[sourceId] = file
      
      const source = this.sources.find(s => s.id === sourceId)
      if (source) {
        // 🔥 Помечаем старый файл для удаления
        if (source.serverFileName && !source.oldFileToDelete) {
          source.oldFileToDelete = {
            fileName: source.serverFileName,
            displayName: source.displayFileName
          }
        }
        
        source.newFile = file
        source.displayFileName = file.name // 🔥 обновляем имя для отображения
        source.fileName = file.name
        source.fileSize = file.size
        source.fileChanged = true
        source.displayType = 'file'
        
        // 🔥 Сохраняем имя в кэш
        if (!source.id.startsWith('temp_')) {
          const nameCache = JSON.parse(localStorage.getItem('downloadSourceNames') || '{}')
          nameCache[source.id] = file.name
          localStorage.setItem('downloadSourceNames', JSON.stringify(nameCache))
        }
      }
      
      event.target.value = ''
    },
    
    async removeSource(sourceId) {
      if (!confirm('Удалить этот источник скачивания?')) return
      
      try {
        const source = this.sources.find(s => s.id === sourceId)
        const isTemp = sourceId.startsWith('temp_')
        
        if (isTemp) {
          this.sources = this.sources.filter(s => s.id !== sourceId)
          delete this.downloadSourceFiles[sourceId]
          return
        }
        
        // 🔥 Удаляем файл с сервера
        if (source && source.serverFileName) {
          try {
            await filesApi.deleteModFile(source.serverFileName)
            console.log(`🗑️ Файл удален с сервера: ${source.serverFileName}`)
          } catch (deleteError) {
            console.warn(`⚠️ Не удалось удалить файл: ${deleteError.message}`)
          }
          
          // 🔥 Удаляем из кэша
          const nameCache = JSON.parse(localStorage.getItem('downloadSourceNames') || '{}')
          delete nameCache[source.id]
          localStorage.setItem('downloadSourceNames', JSON.stringify(nameCache))
        }
        
        await sourcesApi.delete(sourceId)
        this.sources = this.sources.filter(s => s.id !== sourceId)
        delete this.downloadSourceFiles[sourceId]
        
      } catch (error) {
        console.error('❌ Ошибка удаления источника:', error)
        alert('Ошибка при удалении источника: ' + error.message)
      }
    },
    
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
    
    // 🔥 ГЛАВНЫЙ МЕТОД
    async processSources(modId) {
      try {
        console.log("💾 Сохранение источников")
        
        // 🔥 ШАГ 1: Удаляем старые файлы, если они были заменены
        await this.deleteReplacedFiles()
        
        // 🔥 ШАГ 2: Сохраняем источники
        for (let i = 0; i < this.sources.length; i++) {
          const source = this.sources[i]
          
          // Пропускаем пустые источники
          if (!source.title && !source.newFile && !source.url && !source.filePath) {
            continue
          }
          
          // Проверка обязательных полей
          if (!source.versionIds.length || !source.modLoaderIds.length) {
            throw new Error(`Источник "${source.title}": выберите версии и загрузчики`)
          }
          
          const sourceData = {
            title: source.title || `Файл для мода`,
            url: source.url || null,
            versionIds: source.versionIds,
            modLoaderIds: source.modLoaderIds
          }
          
          // 🔥 ЛОГИКА ОБРАБОТКИ ФАЙЛОВ
          if (source.newFile) {
            // СЛУЧАЙ 1: Загружаем новый файл
            console.log(`📤 Загружаем новый файл: ${source.newFile.name}`)
            
            const uploadResult = await filesApi.uploadModFile(
              source.newFile,
              source.versionIds,
              source.modLoaderIds,
              modId
            )
            
            sourceData.filePath = uploadResult.filePath
            sourceData.fileName = source.displayFileName || source.newFile.name // 🔥 используем displayFileName
            sourceData.fileSize = uploadResult.fileSize || source.newFile.size
            
            // 🔥 Сохраняем имя в кэш
            if (!source.id.startsWith('temp_')) {
              const nameCache = JSON.parse(localStorage.getItem('downloadSourceNames') || '{}')
              nameCache[source.id] = source.displayFileName || source.newFile.name
              localStorage.setItem('downloadSourceNames', JSON.stringify(nameCache))
            }
            
          } else if (source.serverFileName) {
            // СЛУЧАЙ 2: Работаем с существующим файлом
            
            if (source.versionsChanged || source.loadersChanged) {
              // 🔥 Переименовываем файл
              console.log(`🔄 Переименовываем файл: ${source.serverFileName}`)
              
              try {
                const renameResult = await filesApi.renameModFile(
                  source.serverFileName,
                  source.versionIds,
                  source.modLoaderIds,
                  modId
                )
                
                sourceData.filePath = renameResult.filePath
                sourceData.fileName = source.displayFileName || source.fileName // 🔥 используем displayFileName
                sourceData.fileSize = renameResult.fileSize
                
              } catch (renameError) {
                console.error(`❌ Ошибка переименования:`, renameError)
                // Оставляем старые данные
                sourceData.filePath = source.filePath
                sourceData.fileName = source.displayFileName || source.fileName
                sourceData.fileSize = source.fileSize
              }
              
            } else {
              // Без изменений
              sourceData.filePath = source.filePath
              sourceData.fileName = source.displayFileName || source.fileName // 🔥 используем displayFileName
              sourceData.fileSize = source.fileSize
            }
          }
          
          // 🔥 Сохраняем источник в БД
          try {
            if (source.id.startsWith('temp_')) {
              await sourcesApi.create(modId, sourceData)
            } else {
              await sourcesApi.update(source.id, sourceData)
            }
            
          } catch (dbError) {
            console.error(`❌ Ошибка сохранения в БД:`, dbError)
            throw new Error(`Ошибка сохранения источника: ${dbError.message}`)
          }
        }
        
        console.log("🎯 Все источники успешно сохранены!")
        return []
        
      } catch (error) {
        console.error("❌ Критическая ошибка сохранения:", error)
        throw error
      }
    },
    
    // 🔥 УДАЛЕНИЕ ЗАМЕНЕННЫХ ФАЙЛОВ
    async deleteReplacedFiles() {
      const filesToDelete = this.sources
        .filter(source => source.oldFileToDelete)
        .map(source => source.oldFileToDelete)
      
      if (filesToDelete.length === 0) return
      
      console.log(`🗑️ Удаляем ${filesToDelete.length} замененных файлов`)
      
      for (const fileInfo of filesToDelete) {
        try {
          await filesApi.deleteModFile(fileInfo.fileName)
          console.log(`✅ Файл удален: ${fileInfo.fileName}`)
        } catch (error) {
          console.warn(`⚠️ Не удалось удалить файл ${fileInfo.fileName}:`, error.message)
        }
      }
    }
  }
}
</script>

<style scoped>
/* Стили остаются такими же */
.db-file {
  background: #fff3cd !important;
  border-left: 4px solid #ffc107 !important;
  color: #856404 !important;
}

.file-info.db-file small {
  color: #856404 !important;
}

.file-info.new-file {
  background: #e8f5e9 !important;
  border-left: 4px solid #2ecc71 !important;
}

.warning-text {
  color: #e74c3c !important;
  font-weight: 500;
  display: block;
  margin-top: 5px;
}

.file-path {
  display: block;
  font-size: 11px;
  color: #6c757d;
  word-break: break-all;
  margin-top: 3px;
}

/* Остальные существующие стили */
.download-sources {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.sources-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.sources-header h4 {
  margin: 0;
  color: #2c3e50;
}

.btn-add-source {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add-source:hover {
  background: #2980b9;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.source-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e0e0e0;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.source-number {
  font-weight: bold;
  color: #3498db;
}

.btn-remove-source {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-remove-source:hover {
  background: #c0392b;
}

/* Чекбоксы */
.checkbox-list.compact {
  max-height: 150px;
  overflow-y: auto;
  padding: 5px;
}

.checkbox-item {
  display: block;
  padding: 5px;
  font-size: 13px;
}

/* Типы источников */
.source-type {
  margin-top: 20px;
}

.type-tabs {
  display: flex;
  border-bottom: 2px solid #ddd;
  margin-bottom: 15px;
}

.type-tab {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.type-tab.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.type-tab:hover:not(.active) {
  color: #2980b9;
}

/* Файл */
.file-source {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.existing-file {
  background: #e3f2fd;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  border-left: 4px solid #1976d2;
}

.file-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-file {
  background: #2ecc71;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-file:hover {
  background: #27ae60;
}

.file-name {
  color: #495057;
  font-size: 14px;
  word-break: break-all;
}

/* Ссылка */
.url-source input {
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
}

.url-source .hint {
  display: block;
  margin-top: 5px;
  color: #6c757d;
  font-size: 12px;
}

.empty-sources {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  background: white;
  border-radius: 8px;
  border: 2px dashed #ddd;
}
</style>