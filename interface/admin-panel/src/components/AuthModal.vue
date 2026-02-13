<!-- src/components/AuthModal.vue -->
<template>
  <div class="auth-modal-overlay" @click.self="$emit('close')">
    <div class="auth-modal">
      <div class="auth-modal-header">
        <h2>Вход в админ-панель</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <div class="auth-modal-body">
        <!-- Сообщение об ошибке/успехе -->
        <div v-if="message" :class="['auth-message', messageType]">
          {{ message }}
        </div>
        
        <!-- Форма -->
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="username">Имя пользователя:</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              :class="{ 'error': fieldErrors.username }"
              placeholder="Введите логин"
            />
            <div v-if="fieldErrors.username" class="field-error">
              {{ fieldErrors.username }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">Пароль:</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              :class="{ 'error': fieldErrors.password }"
              placeholder="Введите пароль"
            />
            <div v-if="fieldErrors.password" class="field-error">
              {{ fieldErrors.password }}
            </div>
          </div>
          
          <!-- Информация о доступе -->
          <div class="access-info">
            <p><strong>⚠️ Доступ только для администраторов</strong></p>
            <p>Доступ к админ-панели выдается администратором системы.</p>
            <p>Если у вас нет учетной записи, обратитесь к администратору.</p>
          </div>
          
          <!-- Кнопки -->
          <div class="auth-buttons">
            <button 
              type="submit" 
              :disabled="loading"
              class="btn-primary"
            >
              <span v-if="loading" class="spinner-small"></span>
              <span v-else>Войти</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { authApi, setAuthToken } from '../api.js'

export default {
  name: 'AuthModal',
  
  props: {
    show: Boolean
  },
  
  data() {
    return {
      loading: false,
      message: '',
      messageType: '',
      
      form: {
        username: '',
        password: ''
      },
      
      fieldErrors: {}
    }
  },
  
  methods: {
    // Очистка формы
    clearForm() {
      this.form = {
        username: '',
        password: ''
      }
    },
    
    // Очистка ошибок
    clearErrors() {
      this.message = ''
      this.fieldErrors = {}
    },
    
    // Обработка отправки формы
    async handleSubmit() {
      this.clearErrors()
      
      // Валидация полей
      if (!this.form.username.trim()) {
        this.fieldErrors.username = 'Введите имя пользователя'
        return
      }
      
      if (!this.form.password) {
        this.fieldErrors.password = 'Введите пароль'
        return
      }
      
      this.loading = true
      
      try {
        // Вход
        const result = await authApi.login({
          nickname: this.form.username.trim(),
          password: this.form.password
        })
        
        setAuthToken(result.token)
        this.$emit('login-success', result.token)
        this.showMessage('Успешный вход!', 'success')
        
      } catch (error) {
        console.error('Auth error:', error)
        this.handleAuthError(error)
        
      } finally {
        this.loading = false
      }
    },
    
    // Обработка ошибок авторизации
    handleAuthError(error) {
      let userMessage = 'Ошибка входа'
      const fieldErrors = {}
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        userMessage = 'Неверное имя пользователя или пароль'
        fieldErrors.username = 'Проверьте логин'
        fieldErrors.password = 'Проверьте пароль'
        
      } else if (error.message.includes('400')) {
        userMessage = 'Проверьте правильность введенных данных'
        
      } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        userMessage = 'Проблемы с соединением. Проверьте интернет'
      }
      
      // Показываем ошибки полей
      Object.keys(fieldErrors).forEach(fieldId => {
        this.fieldErrors[fieldId] = fieldErrors[fieldId]
      })
      
      this.showMessage(userMessage, 'error')
    },
    
    // Показать сообщение
    showMessage(message, type) {
      this.message = message
      this.messageType = type
      
      if (type === 'success') {
        // Автоматически скрываем успешное сообщение через 3 секунды
        setTimeout(() => {
          this.message = ''
        }, 3000)
      }
    }
  },
  
  watch: {
    // При закрытии модалки очищаем форму
    show(newVal) {
      if (!newVal) {
        this.clearForm()
        this.clearErrors()
      }
    }
  }
}
</script>

<style scoped>
.auth-modal-overlay {
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
}

.auth-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.auth-modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.auth-modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: #f5f5f5;
}

.auth-modal-body {
  padding: 20px;
}

.auth-message {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}

.auth-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.auth-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input {
  width: 93%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
}

.form-group input.error {
  border-color: #e74c3c;
}

.field-error {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 5px;
}

.access-info {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #856404;
}

.access-info p {
  margin: 8px 0;
}

.access-info strong {
  display: block;
  margin-bottom: 10px;
}

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>