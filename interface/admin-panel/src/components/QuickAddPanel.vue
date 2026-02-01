<!-- src/components/QuickAddPanel.vue -->
<template>
  <div class="quick-add-panel">
    <div class="panel-header">
      <h3>➕ Быстрое добавление</h3>
      <button @click="togglePanel" class="toggle-btn">
        {{ isExpanded ? '▲ Свернуть' : '▼ Развернуть' }}
      </button>
    </div>
    
    <div v-if="isExpanded" class="panel-body">
      <!-- Всплывающее сообщение -->
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
      
      <!-- Сетка элементов для добавления -->
      <div class="quick-add-grid">
        <!-- Версия Minecraft -->
        <div class="quick-add-item">
          <label for="quick-version">Версия Minecraft:</label>
          <div class="input-group">
            <input
              id="quick-version"
              v-model="inputs.version"
              type="text"
              placeholder="Например: 1.20.1"
              @keyup.enter="addVersion"
            />
            <button 
              @click="addVersion"
              :disabled="loading.version"
              :class="{ loading: loading.version }"
              data-type="version"
            >
              <span v-if="loading.version" class="spinner-small"></span>
              <span v-else>{{ buttonTexts.version }}</span>
            </button>
          </div>
        </div>
        
        <!-- Загрузчик модов -->
        <div class="quick-add-item">
          <label for="quick-modloader">Загрузчик модов:</label>
          <div class="input-group">
            <input
              id="quick-modloader"
              v-model="inputs.modloader"
              type="text"
              placeholder="Например: Forge"
              @keyup.enter="addModLoader"
            />
            <button 
              @click="addModLoader"
              :disabled="loading.modloader"
              :class="{ loading: loading.modloader }"
              data-type="modloader"
            >
              <span v-if="loading.modloader" class="spinner-small"></span>
              <span v-else>{{ buttonTexts.modloader }}</span>
            </button>
          </div>
        </div>
        
        <!-- Тег -->
        <div class="quick-add-item">
          <label for="quick-tag">Тег:</label>
          <div class="input-group">
            <input
              id="quick-tag"
              v-model="inputs.tag"
              type="text"
              placeholder="Например: Оптимизация"
              @keyup.enter="addTag"
            />
            <button 
              @click="addTag"
              :disabled="loading.tag"
              :class="{ loading: loading.tag }"
              data-type="tag"
            >
              <span v-if="loading.tag" class="spinner-small"></span>
              <span v-else>{{ buttonTexts.tag }}</span>
            </button>
          </div>
        </div>
        
        <!-- Разработчик -->
        <div class="quick-add-item">
          <label for="quick-developer">Разработчик:</label>
          <div class="input-group">
            <input
              id="quick-developer"
              v-model="inputs.developer"
              type="text"
              placeholder="Например: sp614x"
              @keyup.enter="addDeveloper"
            />
            <button 
              @click="addDeveloper"
              :disabled="loading.developer"
              :class="{ loading: loading.developer }"
              data-type="developer"
            >
              <span v-if="loading.developer" class="spinner-small"></span>
              <span v-else>{{ buttonTexts.developer }}</span>
            </button>
          </div>
        </div>
        
        <!-- Сложность -->
        <div class="quick-add-item">
          <label for="quick-difficulty">Сложность:</label>
          <div class="input-group">
            <input
              id="quick-difficulty"
              v-model="inputs.difficulty"
              type="text"
              placeholder="Например: Средняя"
              @keyup.enter="addDifficulty"
            />
            <button 
              @click="addDifficulty"
              :disabled="loading.difficulty"
              :class="{ loading: loading.difficulty }"
              data-type="difficulty"
            >
              <span v-if="loading.difficulty" class="spinner-small"></span>
              <span v-else>{{ buttonTexts.difficulty }}</span>
            </button>
          </div>
        </div>
        
        <!-- Фокус -->
        <div class="quick-add-item">
          <label for="quick-focus">Фокус (направление):</label>
          <div class="input-group">
            <input
              id="quick-focus"
              v-model="inputs.focus"
              type="text"
              placeholder="Например: Технологии"
              @keyup.enter="addFocus"
            />
            <button 
              @click="addFocus"
              :disabled="loading.focus"
              :class="{ loading: loading.focus }"
              data-type="focus"
            >
              <span v-if="loading.focus" class="spinner-small"></span>
              <span v-else>{{ buttonTexts.focus }}</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Подсказка -->
      <div class="hint">
        💡 Нажмите Enter или кнопку для добавления. Можно добавлять несколько элементов подряд.
      </div>
    </div>
  </div>
</template>

<script>
import { quickAddApi } from '../api.js'

export default {
  name: 'QuickAddPanel',
  
  emits: ['item-added'],
  
  data() {
    return {
      isExpanded: true,
      message: '',
      messageType: '',
      messageTimeout: null,
      
      // Введенные значения
      inputs: {
        version: '',
        modloader: '',
        tag: '',
        developer: '',
        difficulty: '',
        focus: ''
      },
      
      // Статус загрузки для каждой кнопки
      loading: {
        version: false,
        modloader: false,
        tag: false,
        developer: false,
        difficulty: false,
        focus: false
      },
      
      // Текст кнопок
      buttonTexts: {
        version: '+ Версия',
        modloader: '+ Загрузчик',
        tag: '+ Тег',
        developer: '+ Разработчик',
        difficulty: '+ Сложность',
        focus: '+ Фокус'
      },
      
      // Оригинальные тексты кнопок (для восстановления)
      originalButtonTexts: {
        version: '+ Версия',
        modloader: '+ Загрузчик',
        tag: '+ Тег',
        developer: '+ Разработчик',
        difficulty: '+ Сложность',
        focus: '+ Фокус'
      }
    }
  },
  
  methods: {
    // Переключение панели
    togglePanel() {
      this.isExpanded = !this.isExpanded
    },
    
    // Показать сообщение
    showMessage(text, type = 'info') {
      this.message = text
      this.messageType = type
      
      // Автоматическое скрытие через 3 секунды
      if (this.messageTimeout) {
        clearTimeout(this.messageTimeout)
      }
      
      this.messageTimeout = setTimeout(() => {
        this.message = ''
      }, 3000)
    },
    
    // Показать feedback на кнопке
    showButtonFeedback(type, status, message) {
      const originalText = this.originalButtonTexts[type]
      
      // Изменяем текст кнопки
      this.buttonTexts[type] = message
      
      // Восстанавливаем через 2 секунды
      setTimeout(() => {
        this.buttonTexts[type] = originalText
        this.loading[type] = false
      }, 2000)
    },
    
    // Получить русское название типа
    getTypeName(type) {
      const names = {
        version: 'Версия',
        modloader: 'Загрузчик',
        tag: 'Тег',
        developer: 'Разработчик',
        difficulty: 'Сложность',
        focus: 'Фокус'
      }
      return names[type] || type
    },
    
    // Добавление версии
    async addVersion() {
      await this.quickAdd('version', {
        title: this.inputs.version.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    },
    
    // Добавление загрузчика
    async addModLoader() {
      await this.quickAdd('modloader', {
        title: this.inputs.modloader.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    },
    
    // Добавление тега
    async addTag() {
      await this.quickAdd('tag', {
        title: this.inputs.tag.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    },
    
    // Добавление разработчика
    async addDeveloper() {
      await this.quickAdd('developer', {
        nickname: this.inputs.developer.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    },
    
    // Добавление сложности
    async addDifficulty() {
      await this.quickAdd('difficulty', {
        title: this.inputs.difficulty.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    },
    
    // Добавление фокуса
    async addFocus() {
      await this.quickAdd('focus', {
        name: this.inputs.focus.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    },
    
    // Общий метод быстрого добавления
    async quickAdd(type, data) {
      const value = data.title || data.nickname || data.name
      
      if (!value) {
        this.showMessage(`Введите значение для ${this.getTypeName(type)}`, 'error')
        return
      }
      
      // Начинаем загрузку
      this.loading[type] = true
      const inputId = `quick-${type}`
      
      try {
        let result
        
        // Вызываем соответствующий API метод
        switch (type) {
          case 'version':
            result = await quickAddApi.createVersion(data)
            break
          case 'modloader':
            result = await quickAddApi.createModLoader(data)
            break
          case 'tag':
            result = await quickAddApi.createTag(data)
            break
          case 'developer':
            result = await quickAddApi.createDeveloper(data)
            break
          case 'difficulty':
            result = await quickAddApi.createDifficulty(data)
            break
          case 'focus':
            result = await quickAddApi.createFocus(data)
            break
          default:
            throw new Error(`Неизвестный тип: ${type}`)
        }
        
        console.log(`${type} создан:`, result)
        
        // Очищаем поле ввода
        this.inputs[type] = ''
        
        // Показываем успех
        this.showButtonFeedback(type, 'success', '✅ Успешно!')
        this.showMessage(`${this.getTypeName(type)} "${value}" добавлен`, 'success')
        
        // Отправляем событие родителю
        this.$emit('item-added', { type, data: result })
        
      } catch (error) {
        console.error(`Ошибка создания ${type}:`, error)
        
        // Обработка ошибок
        let userMessage = `Ошибка создания ${this.getTypeName(type)}`
        
        if (error.message.includes('Nickname cannot be empty')) {
          userMessage = 'Имя разработчика не может быть пустым'
        } else if (error.message.includes('Name') && error.message.includes('required')) {
          userMessage = 'Поле "Название" обязательно для заполнения'
        } else if (error.message.includes('400')) {
          userMessage = 'Проверьте правильность введенных данных'
        } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          userMessage = 'Проблемы с соединением. Проверьте интернет'
        } else if (error.message.includes('401')) {
          userMessage = 'Требуется авторизация'
        }
        
        // Показываем ошибку
        this.showButtonFeedback(type, 'error', '❌ Ошибка')
        this.showMessage(userMessage, 'error')
        
      } finally {
        // Снимаем блокировку через короткое время, чтобы анимация feedback была видна
        setTimeout(() => {
          this.loading[type] = false
        }, 500)
      }
    },
    
    // Быстрое добавление всех заполненных полей
    async addAll() {
      const types = Object.keys(this.inputs)
      
      for (const type of types) {
        if (this.inputs[type].trim()) {
          await this[`add${type.charAt(0).toUpperCase() + type.slice(1)}`]()
          // Небольшая задержка между запросами
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
    }
  }
}
</script>

<style scoped>
.quick-add-panel {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.toggle-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.toggle-btn:hover {
  background: #2980b9;
}

.message {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  animation: fadeIn 0.3s;
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

.message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.quick-add-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.quick-add-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-add-item label {
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}

.input-group {
  display: flex;
  gap: 10px;
}

.input-group input {
  flex: 1;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #3498db;
}

.input-group button {
  background: #2ecc71;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  min-width: 100px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.input-group button:hover:not(:disabled) {
  background: #27ae60;
}

.input-group button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.input-group button.loading {
  background: #f39c12;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.hint {
  color: #6c757d;
  font-size: 14px;
  text-align: center;
  padding: 10px;
  background: #f0f2f5;
  border-radius: 6px;
}

/* Анимация для feedback на кнопке */
@keyframes successPulse {
  0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(46, 204, 113, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
}

@keyframes errorPulse {
  0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
  100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
}

.input-group button.success-feedback {
  animation: successPulse 2s;
}

.input-group button.error-feedback {
  animation: errorPulse 2s;
}

/* Адаптивность */
@media (max-width: 768px) {
  .quick-add-grid {
    grid-template-columns: 1fr;
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .input-group button {
    width: 100%;
  }
}
</style>