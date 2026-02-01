<!-- src/components/AuthModal.vue -->
<template>
  <div class="auth-modal-overlay" @click.self="$emit('close')">
    <div class="auth-modal">
      <div class="auth-modal-header">
        <h2>{{ isRegistering ? 'Регистрация' : 'Вход в систему' }}</h2>
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
              placeholder="Введите имя"
            />
            <div v-if="fieldErrors.username" class="field-error">
              {{ fieldErrors.username }}
            </div>
          </div>
          
          <!-- Email только для регистрации -->
          <div v-if="isRegistering" class="form-group">
            <label for="email">Email:</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              :class="{ 'error': fieldErrors.email }"
              placeholder="Введите email"
            />
            <div v-if="fieldErrors.email" class="field-error">
              {{ fieldErrors.email }}
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
              @input="validatePasswordLive"
            />
            <div v-if="fieldErrors.password" class="field-error">
              {{ fieldErrors.password }}
            </div>
          </div>
          
          <!-- Подтверждение пароля только для регистрации -->
          <div v-if="isRegistering" class="form-group">
            <label for="confirmPassword">Подтвердите пароль:</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              :class="{ 'error': fieldErrors.confirmPassword }"
              placeholder="Повторите пароль"
            />
            <div v-if="fieldErrors.confirmPassword" class="field-error">
              {{ fieldErrors.confirmPassword }}
            </div>
          </div>
          
          <!-- Подсказки для пароля -->
          <div v-if="isRegistering" class="password-hints">
            <p>Пароль должен содержать:</p>
            <ul>
              <li :class="{ valid: passwordHints.length }">
                📏 Минимум 6 символов
              </li>
              <li :class="{ valid: passwordHints.lowercase }">
                🔡 Строчные буквы (a-z)
              </li>
              <li :class="{ valid: passwordHints.uppercase }">
                🔠 Заглавные буквы (A-Z)
              </li>
              <li :class="{ valid: passwordHints.numbers }">
                1️⃣ Цифры (0-9)
              </li>
              <li :class="{ valid: passwordHints.special }">
                ⚡ Спецсимволы (!@#$% и т.д.)
              </li>
            </ul>
          </div>
          
          <!-- Кнопки -->
          <div class="auth-buttons">
            <button 
              type="submit" 
              :disabled="loading"
              class="btn-primary"
            >
              <span v-if="loading" class="spinner-small"></span>
              <span v-else>{{ isRegistering ? 'Зарегистрироваться' : 'Войти' }}</span>
            </button>
            
            <button 
              type="button" 
              @click="toggleMode"
              class="btn-link"
            >
              {{ isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться' }}
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
      isRegistering: false,
      loading: false,
      message: '',
      messageType: '',
      
      form: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      
      fieldErrors: {},
      
      passwordHints: {
        length: false,
        lowercase: false,
        uppercase: false,
        numbers: false,
        special: false
      }
    }
  },
  
  methods: {
    // Переключение между входом и регистрацией
    toggleMode() {
      this.isRegistering = !this.isRegistering
      this.clearForm()
      this.clearErrors()
    },
    
    // Очистка формы
    clearForm() {
      this.form = {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      }
      this.passwordHints = {
        length: false,
        lowercase: false,
        uppercase: false,
        numbers: false,
        special: false
      }
    },
    
    // Очистка ошибок
    clearErrors() {
      this.message = ''
      this.fieldErrors = {}
    },
    
    // Валидация пароля в реальном времени
    validatePasswordLive() {
      const password = this.form.password
      
      if (!password) {
        this.passwordHints = {
          length: false,
          lowercase: false,
          uppercase: false,
          numbers: false,
          special: false
        }
        return
      }
      
      this.passwordHints = {
        length: password.length >= 6,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[^a-zA-Z0-9]/.test(password)
      }
    },
    
    // Валидация пароля перед отправкой
    validatePassword(password) {
      const errors = []
      
      if (password.length < 6) {
        errors.push('Минимум 6 символов')
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Добавьте строчные буквы (a-z)')
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Добавьте заглавные буквы (A-Z)')
      }
      if (!/\d/.test(password)) {
        errors.push('Добавьте цифры (0-9)')
      }
      if (!/[^a-zA-Z0-9]/.test(password)) {
        errors.push('Добавьте спецсимволы (!@#$% и т.д.)')
      }
      
      return errors
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
      
      if (this.isRegistering) {
        // Валидация для регистрации
        if (!this.form.email.trim()) {
          this.fieldErrors.email = 'Введите email'
          return
        }
        
        if (this.form.password !== this.form.confirmPassword) {
          this.fieldErrors.confirmPassword = 'Пароли не совпадают'
          return
        }
        
        const passwordErrors = this.validatePassword(this.form.password)
        if (passwordErrors.length > 0) {
          this.fieldErrors.password = passwordErrors[0]
          return
        }
      }
      
      this.loading = true
      
      try {
        if (this.isRegistering) {
          // Регистрация
          const result = await authApi.register({
            username: this.form.username.trim(),
            email: this.form.email.trim(),
            password: this.form.password
          })
          
          if (result.token) {
            setAuthToken(result.token)
            this.$emit('login-success', result.token)
            this.showMessage('Регистрация и вход успешны!', 'success')
          } else {
            this.showMessage('Регистрация успешна! Теперь войдите в систему', 'success')
            this.isRegistering = false
            this.form.password = ''
            this.form.confirmPassword = ''
          }
          
        } else {
          // Вход
          const result = await authApi.login({
            nickname: this.form.username.trim(),
            password: this.form.password
          })
          
          setAuthToken(result.token)
          this.$emit('login-success', result.token)
          this.showMessage('Успешный вход!', 'success')
        }
        
      } catch (error) {
        console.error('Auth error:', error)
        this.handleAuthError(error)
        
      } finally {
        this.loading = false
      }
    },
    
    // Обработка ошибок авторизации
    handleAuthError(error) {
      let userMessage = this.isRegistering ? 'Ошибка регистрации' : 'Ошибка входа'
      const fieldErrors = {}
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        userMessage = 'Неверное имя пользователя или пароль'
        fieldErrors.username = 'Проверьте логин'
        fieldErrors.password = 'Проверьте пароль'
        
      } else if (error.message.includes('400')) {
        userMessage = 'Проверьте правильность введенных данных'
        
      } else if (error.message.includes('User already exists')) {
        userMessage = 'Пользователь с таким именем уже существует'
        fieldErrors.username = 'Имя занято'
        
      } else if (error.message.includes('Email already exists')) {
        userMessage = 'Пользователь с такой почтой уже существует'
        fieldErrors.email = 'Почта уже используется'
        
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
  width: 100%;
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

.password-hints {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.password-hints p {
  margin-top: 0;
  font-weight: 500;
  margin-bottom: 10px;
}

.password-hints ul {
  margin: 0;
  padding-left: 20px;
}

.password-hints li {
  margin-bottom: 5px;
  list-style-type: none;
  position: relative;
  padding-left: 25px;
}

.password-hints li:before {
  content: '⭕';
  position: absolute;
  left: 0;
}

.password-hints li.valid:before {
  content: '✅';
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

.btn-link {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
  padding: 0;
}

.btn-link:hover {
  color: #2980b9;
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