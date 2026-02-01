// main.js
import { createApp } from 'vue'
import App from './App.vue'

// Импортируем компоненты
import AuthModal from './components/AuthModal.vue'
import QuickAddPanel from './components/QuickAddPanel.vue'
import DownloadSources from './components/DownloadSources.vue'
import GalleryUpload from './components/GalleryUpload.vue'
import ModFormModal from './components/ModFormModal.vue'
import EntitiesManager from './components/EntitiesManager.vue'

// Создаем приложение
const app = createApp(App)

// Регистрируем глобальные компоненты
app.component('AuthModal', AuthModal)
app.component('QuickAddPanel', QuickAddPanel)
app.component('DownloadSources', DownloadSources)
app.component('GalleryUpload', GalleryUpload)
app.component('odFormModal', ModFormModal)
app.component('EntitiesManager', EntitiesManager)

// Глобальные утилиты
app.config.globalProperties.$downloadFile = async (fileName, downloadName) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:5126/upload/mods/${encodeURIComponent(fileName)}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })

    if (!response.ok) {
      throw new Error(`Ошибка ${response.status}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName || fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('Ошибка скачивания:', error)
    throw error
  }
}

// Монтируем приложение
app.mount('#app')

console.log('✅ Vue приложение запущено!')