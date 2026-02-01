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
            @input="saveSourceState(source.id)"
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
          
          <!-- URL поле (показывается если displayType = 'url' ИЛИ всегда сохраняется) -->
          <div v-if="source.displayType === 'url'" class="url-source">
            <input
              v-model="source.url"
              type="url"
              placeholder="https://example.com/download/mod.jar"
              @input="saveSourceState(source.id)"
            />
            <small class="hint">Внешняя ссылка для скачивания</small>
          </div>
          
          <!-- Файл (показывается если displayType = 'file' ИЛИ всегда сохраняется) -->
          <div v-else class="file-source">
            <div v-if="source.fileName || source.filePath" class="existing-file">
              <p><strong>Текущий файл:</strong> {{ source.fileName || 'файл из БД' }}</p>
              <small v-if="source.fileSize">Размер: {{ formatFileSize(source.fileSize) }}</small>
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
                {{ source.fileName || source.filePath ? 'Заменить файл' : 'Выбрать файл' }}
              </button>
              <span v-if="source.fileName" class="file-name">{{ source.fileName }}</span>
            </div>
            
            <div v-if="source.newFile" class="file-info">
              <small>Новый файл: {{ source.newFile.name }} ({{ formatFileSize(source.newFile.size) }})</small>
            </div>
            
            <!-- Информация о файле из БД -->
            <div v-if="source.filePath && !source.newFile" class="file-info db-file">
              <small>📎 Файл в БД: {{ source.fileName }}</small>
              <br>
              <small style="color: #f39c12;">⚠️ Для изменения файла выберите новый</small>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="sources.length === 0" class="empty-sources">
      <p>📥 Нет источников скачивания. Добавьте хотя бы один.</p>
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
      // Глобальное хранилище файлов (как в рабочем коде)
      downloadSourceFiles: {}
    }
  },
  
  mounted() {
    if (this.initialSources.length > 0) {
      this.loadExistingSources()
    }
    // НЕ создаем источник по умолчанию!
  },
  
  // В секцию script после mounted():
watch: {
  // Отслеживаем изменение modId
  modId: {
    immediate: true,
    handler(newModId) {
      if (newModId && this.initialSources.length > 0) {
        this.loadExistingSources()
      }
    }
  },
  
  // Отслеживаем изменение initialSources
  initialSources: {
    immediate: true,
    handler(newSources) {
      if (newSources && newSources.length > 0) {
        // Небольшая задержка чтобы компонент успел смонтироваться
        setTimeout(() => {
          this.loadExistingSources()
        }, 100)
      }
    }
  }
},

  methods: {
    // Загрузка существующих источников (как в рабочем коде)
    // Загрузка существующих источников (как в рабочем коде)
loadExistingSources() {
  console.log('🔄 ПРЕДЗАПОЛНЕНИЕ ИСТОЧНИКОВ:', {
    initialSources: this.initialSources,
    modId: this.modId
  })
  
  if (!this.initialSources || this.initialSources.length === 0) {
    console.log('⚠️ Нет данных для предзаполнения')
    this.sources = []
    return
  }
  
  this.sources = this.initialSources.map(source => {
    console.log('📦 Обрабатываем источник:', source)
    
    // Определяем что показывать: если есть файл в БД - показываем файл, иначе URL
    const hasFileInDb = !!source.filePath
    const displayType = hasFileInDb ? 'file' : 'url'
    
    return {
      id: source.id,
      title: source.title || `Источник скачивания`,
      displayType: displayType,
      url: source.url || '',
      filePath: source.filePath || null,
      fileName: source.fileName || null,
      fileSize: source.fileSize || null,
      newFile: null, // новый файл, если выбрали
      versionIds: source.versions?.map(v => v.id) || [],
      modLoaderIds: source.modLoaders?.map(ml => ml.id) || []
    }
  })
  
  console.log('✅ Существующие источники загружены:', this.sources)
  
  // Отладочная информация
  this.sources.forEach((source, index) => {
    console.log(`   ${index + 1}. "${source.title}"`, {
      type: source.displayType,
      filePath: source.filePath,
      versions: source.versionIds,
      loaders: source.modLoaderIds
    })
  })
},
    
    // Добавить новый источник (без файла по умолчанию)
    addSource() {
      const sourceId = 'temp_' + Date.now() + '_' + Math.random()
      const newSource = {
        id: sourceId,
        title: '',
        displayType: 'url', // по умолчанию показываем URL
        url: '',
        filePath: null,
        fileName: null,
        fileSize: null,
        newFile: null,
        versionIds: [],
        modLoaderIds: []
      }
      
      console.log('➕ Новый источник:', newSource)
      this.sources.push(newSource)
    },
    
    // Установить тип отображения (только UI, данные сохраняются всегда)
    setSourceType(sourceId, type) {
      const source = this.sources.find(s => s.id === sourceId)
      if (source) {
        source.displayType = type
        console.log(`🔀 Переключение типа отображения для ${sourceId}: ${type}`)
      }
    },
    
    // Сохранить состояние источника
    saveSourceState(sourceId) {
      // В Vue это делается автоматически через v-model
      console.log(`💾 Состояние сохранено для ${sourceId}`)
    },
    
    // Обновить счетчик выбранных
    updateSelectionCount(sourceId, type) {
      // В Vue счетчик обновляется автоматически через длину массива
      const source = this.sources.find(s => s.id === sourceId)
      if (source) {
        const count = type === 'version' ? source.versionIds.length : source.modLoaderIds.length
        console.log(`🔢 ${type} выбрано: ${count} для ${sourceId}`)
      }
    },
    
    // Выбрать файл
    triggerFileInput(sourceId) {
      this.$refs['fileInput_' + sourceId][0].click()
    },
    
    // Обработка загрузки файла
    handleFileUpload(event, sourceId) {
      const file = event.target.files[0]
      if (!file) {
        console.log('❌ Файл не выбран')
        return
      }
      
      console.log('📁 Выбран файл:', {
        sourceId: sourceId,
        name: file.name,
        size: file.size,
        type: file.type
      })
      
      // Проверка расширения
      const allowedExtensions = ['.jar', '.zip', '.rar', '.7z']
      const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      
      if (!allowedExtensions.includes(fileExt)) {
        alert(`Неподдерживаемый формат файла. Разрешены: ${allowedExtensions.join(', ')}`)
        return
      }
      
      // Проверка размера (200MB)
      if (file.size > 200 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 200MB')
        return
      }
      
      // Сохраняем файл в глобальное хранилище (как в рабочем коде)
      this.downloadSourceFiles[sourceId] = file
      
      // Обновляем источник
      const source = this.sources.find(s => s.id === sourceId)
      if (source) {
        source.newFile = file
        source.fileName = file.name
        source.fileSize = file.size
        // Переключаем отображение на файл
        source.displayType = 'file'
        
        console.log('✅ Файл добавлен в источник:', source)
      }
      
      // Очищаем input
      event.target.value = ''
    },
    
    // Удалить источник
    async removeSource(sourceId) {
      if (!confirm('Удалить этот источник скачивания?')) return
      
      try {
        // Очищаем глобальное хранилище (как в рабочем коде)
        delete this.downloadSourceFiles[sourceId]
        
        const source = this.sources.find(s => s.id === sourceId)
        const isTemp = sourceId.startsWith('temp_')
        
        if (isTemp) {
          // Удаляем временный источник
          this.sources = this.sources.filter(s => s.id !== sourceId)
          console.log(`🗑️ Временный источник удален: ${sourceId}`)
          return
        }
        
        // Удаляем постоянный источник из БД
        await sourcesApi.delete(sourceId)
        this.sources = this.sources.filter(s => s.id !== sourceId)
        console.log(`🗑️ Источник удален из БД: ${sourceId}`)
        
      } catch (error) {
        console.error('❌ Ошибка удаления источника:', error)
        alert('Ошибка при удалении источника: ' + error.message)
      }
    },
    
    // Форматирование размера файла
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
    
    // ⭐⭐⭐⭐ ГЛАВНЫЙ МЕТОД: Сохранение источников (как в рабочем коде) ⭐⭐⭐⭐
    async processSources(modId) {
      try {
        console.log("💾 Сохранение источников в БД:", {
          modId: modId,
          sourcesCount: this.sources.length,
          sources: this.sources
        })
        
        // Последовательное сохранение каждого источника
        for (let i = 0; i < this.sources.length; i++) {
          const source = this.sources[i]
          console.log(`💾 Сохраняем источник ${i + 1}/${this.sources.length}:`, source)
          
          // Если источник пустой (нет названия, файла и URL) - пропускаем
          if (!source.title && !source.newFile && !source.url && !source.filePath) {
            console.log(`⚠️ Пустой источник, пропускаем`)
            continue
          }
          
          // Проверка обязательных полей
          if (!source.versionIds.length || !source.modLoaderIds.length) {
            throw new Error(`Источник "${source.title}": выберите версии и загрузчики`)
          }
          
          // Подготовка данных источника
          const sourceData = {
            title: source.title || `Файл для мода`,
            url: source.url || null,
            versionIds: source.versionIds,
            modLoaderIds: source.modLoaderIds
          }
          
          // 🔥 КЛЮЧЕВОЙ МОМЕНТ: если есть новый файл - загружаем его
          if (source.newFile) {
            console.log(`📤 Загружаем новый файл: ${source.newFile.name}`)
            
            try {
              const uploadResult = await filesApi.uploadModFile(
                source.newFile,
                source.versionIds,
                source.modLoaderIds,
                modId
              )
              
              console.log(`✅ Файл загружен:`, uploadResult)
              
              sourceData.filePath = uploadResult.filePath
              sourceData.fileName = uploadResult.originalFileName || source.newFile.name
              sourceData.fileSize = uploadResult.fileSize || source.newFile.size
              
            } catch (uploadError) {
              console.error(`❌ Ошибка загрузки файла:`, uploadError)
              throw new Error(`Ошибка загрузки файла: ${uploadError.message}`)
            }
            
          } else if (source.filePath) {
            // Используем существующий файл из БД
            console.log(`📁 Используем существующий файл: ${source.filePath}`)
            sourceData.filePath = source.filePath
            sourceData.fileName = source.fileName
            sourceData.fileSize = source.fileSize
          }
          
          // 🔥 Сохраняем источник в БД
          try {
            let result
            if (source.id.startsWith('temp_')) {
              // Новый источник
              result = await sourcesApi.create(modId, sourceData)
              console.log(`✅ Новый источник создан:`, result)
            } else {
              // Обновление существующего
              result = await sourcesApi.update(source.id, sourceData)
              console.log(`✅ Источник обновлен:`, result)
            }
            
          } catch (dbError) {
            console.error(`❌ Ошибка сохранения в БД:`, dbError)
            throw new Error(`Ошибка сохранения источника: ${dbError.message}`)
          }
        }
        
        console.log("🎯 Все источники успешно сохранены в БД!")
        return []
        
      } catch (error) {
        console.error("❌ Критическая ошибка сохранения:", error)
        throw error
      }
    }
  }
}
</script>

<style scoped>
/* Стили остаются такими же, только добавляем новый класс для файла из БД */
.db-file {
  background: #fff3cd !important;
  border-left: 4px solid #ffc107 !important;
  color: #856404 !important;
}

.file-info.db-file small {
  color: #856404 !important;
}

/* Остальные стили такие же как в предыдущей версии */
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

.file-info {
  margin-top: 10px;
  padding: 8px;
  background: #e8f5e9;
  border-radius: 4px;
  color: #2e7d32;
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