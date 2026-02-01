<template>
  <div class="gallery-upload">
    <div class="gallery-header">
      <h4>Галерея изображений</h4>
      <button @click="addImages" type="button" class="btn-add-images">
        + Добавить изображения
      </button>
    </div>
    
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      @change="handleFiles"
      style="display: none"
    />
    
    <!-- Существующие изображения -->
    <div v-if="existingImages.length > 0" class="existing-gallery">
      <h5>Существующие изображения</h5>
      <div class="gallery-grid">
        <div v-for="image in existingImages" :key="image.id" class="gallery-item existing">
          <img :src="getImageUrl(image.imageUrl)" :alt="image.fileName" />
          <div class="image-overlay">
            <button @click="removeExistingImage(image.id)" type="button" class="btn-remove">
              × Удалить
            </button>
          </div>
          <div class="image-name">{{ image.fileName }}</div>
        </div>
      </div>
    </div>
    
    <!-- Новые изображения -->
    <div v-if="newImages.length > 0" class="new-gallery">
      <h5>Новые изображения</h5>
      <div class="gallery-grid">
        <div v-for="(image, index) in newImages" :key="index" class="gallery-item new">
          <img :src="image.preview" :alt="image.file.name" />
          <div class="image-overlay">
            <button @click="removeNewImage(index)" type="button" class="btn-remove">
              × Удалить
            </button>
          </div>
          <div class="image-name">{{ image.file.name }}</div>
        </div>
      </div>
    </div>
    
    <!-- Пустая галерея -->
    <div v-if="existingImages.length === 0 && newImages.length === 0" class="empty-gallery">
      <p>📸 Нет изображений. Добавьте несколько изображений для галереи.</p>
    </div>
  </div>
</template>

<script>
import { filesApi } from '../api.js'

export default {
  name: 'GalleryUpload',
  
  props: {
    modId: {
      type: String,
      default: null
    },
    initialGallery: {
      type: Array,
      default: () => []
    }
  },
  
  data() {
    return {
      existingImages: [],
      newImages: [],
      imagesToDelete: []
    }
  },
  
  watch: {
    initialGallery: {
      immediate: true,
      handler(newGallery) {
        if (newGallery && newGallery.length > 0) {
          this.existingImages = [...newGallery]
        } else {
          this.existingImages = []
        }
      }
    }
  },
  
  methods: {
    // Полный URL изображения
    getImageUrl(url) {
      if (!url) return ''
      
      if (url.startsWith('http')) return url
      
      if (url.startsWith('/')) {
        return `http://localhost:5126${url}`
      }
      
      return `http://localhost:5126/${url}`
    },
    
    // Добавить изображения
    addImages() {
      this.$refs.fileInput.click()
    },
    
    // Обработка выбранных файлов
    handleFiles(event) {
      const files = Array.from(event.target.files)
      
      files.forEach(file => {
        // Проверка типа
        if (!file.type.startsWith('image/')) {
          alert(`Файл ${file.name} не является изображением`)
          return
        }
        
        // Проверка размера (5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`Изображение ${file.name} слишком большое (макс. 5MB)`)
          return
        }
        
        // Создаем preview
        const reader = new FileReader()
        reader.onload = (e) => {
          this.newImages.push({
            file: file,
            preview: e.target.result
          })
        }
        reader.readAsDataURL(file)
      })
      
      // Очищаем input
      event.target.value = ''
    },
    
    // Удалить существующее изображение
    removeExistingImage(imageId) {
      if (confirm('Удалить это изображение из галереи?')) {
        this.imagesToDelete.push(imageId)
        this.existingImages = this.existingImages.filter(img => img.id !== imageId)
      }
    },
    
    // Удалить новое изображение
    removeNewImage(index) {
      this.newImages.splice(index, 1)
    },
    
    // Обработка галереи
    async processGallery(modId) {
      // Удаляем изображения, помеченные для удаления
      await this.deleteImages()
      
      // Загружаем новые изображения
      const results = []
      
      for (let i = 0; i < this.newImages.length; i++) {
        const image = this.newImages[i]
        try {
          const result = await this.uploadGalleryImage(image.file, modId, i)
          results.push(result)
        } catch (error) {
          throw new Error(`Ошибка загрузки изображения ${image.file.name}: ${error.message}`)
        }
      }
      
      return results
    },
    
    // Удаление изображений
    async deleteImages() {
      for (const imageId of this.imagesToDelete) {
        try {
          await this.deleteGalleryImage(imageId)
        } catch (error) {
          // Продолжаем, даже если не удалось удалить
        }
      }
    },
    
    // API метод для загрузки изображения
    async uploadGalleryImage(file, modId, order) {
      // Загружаем файл на сервер
      const imageUrl = await filesApi.uploadGalleryImage(file, modId)

      // Сохраняем в БД
      const token = localStorage.getItem('token')
      const galleryData = {
        imageUrl: imageUrl,
        fileName: file.name,
        displayOrder: this.existingImages.length + order,
        modId: modId
      }
      
      const response = await fetch('http://localhost:5126/modgalleries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(galleryData)
      })

      if (!response.ok) {
        throw new Error('Ошибка сохранения в галерее')
      }

      return await response.json()
    },
    
    // API метод для удаления изображения
    async deleteGalleryImage(imageId) {
      // Получаем информацию об изображении
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5126/modgalleries/${imageId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (response.ok) {
        const imageData = await response.json()
        
        // Удаляем файл с сервера
        if (imageData.imageUrl) {
          const fileName = imageData.imageUrl.split('/').pop()
          await filesApi.deleteGalleryImage(fileName)
        }
      }

      // Удаляем запись из БД
      const deleteResponse = await fetch(`http://localhost:5126/modgalleries/${imageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      })

      if (!deleteResponse.ok) {
        const error = await deleteResponse.text()
        throw new Error(error)
      }
    }
  }
}
</script>

<style scoped>
.gallery-upload {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.gallery-header h4 {
  margin: 0;
  color: #2c3e50;
}

.btn-add-images {
  background: #9b59b6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-add-images:hover {
  background: #8e44ad;
}

.existing-gallery,
.new-gallery {
  margin-bottom: 30px;
}

.existing-gallery h5,
.new-gallery h5 {
  margin-bottom: 15px;
  color: #495057;
  font-size: 16px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.gallery-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
  background: white;
}

.gallery-item.existing {
  border-color: #3498db;
}

.gallery-item.new {
  border-color: #2ecc71;
}

.gallery-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.gallery-item:hover .image-overlay {
  opacity: 1;
}

.btn-remove {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-remove:hover {
  background: #c0392b;
}

.image-name {
  padding: 8px;
  font-size: 12px;
  text-align: center;
  background: #f8f9fa;
  word-break: break-all;
  max-height: 40px;
  overflow: hidden;
}

.empty-gallery {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  background: white;
  border-radius: 8px;
  border: 2px dashed #ddd;
}
</style>