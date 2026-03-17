<!-- components/download/DownloadModal.vue -->
<template>
  <AppModal
    v-model="show"
    :title="`Скачать: ${mod?.title || ''}`"
    modal-class="download-modal"
  >
    <div v-if="loading" class="download-loading">
      <div class="loading-spinner">📦</div>
      <p>Загрузка источников...</p>
    </div>
    
    <div v-else-if="!sources.length" class="download-empty">
      <p>😔 Нет доступных источников для скачивания</p>
    </div>
    
    <div v-else class="download-table-container">
      <table class="download-table">
        <thead>
          <tr>
            <th>Версии</th>
            <th>Модлоадеры</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="source in sources" :key="source.id" class="download-source-row">
            <td>
              <div class="versions-list">
                {{ formatVersions(source.versions) }}
              </div>
            </td>
            <td>
              <div class="modloaders-list">
                {{ formatModLoaders(source.modLoaders) }}
              </div>
            </td>
            <td>
              <div class="download-actions">
                <AppButton 
                  v-if="source.filePath"
                  variant="primary" 
                  size="sm"
                  @click="downloadFileHandler(source)"
                >
                  ⬇️ Скачать файл
                </AppButton>
                <AppButton 
                  v-if="source.url"
                  variant="secondary" 
                  size="sm"
                  @click="openUrl(source.url)"
                >
                  🌐 Внешняя ссылка
                </AppButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="close">Закрыть</AppButton>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import type { Mod, DownloadSource } from '~/composables/useModsApi'
import AppModal from '../common/AppModal.vue'
import AppButton from '../common/AppButton.vue'

const props = defineProps<{
  modelValue: boolean
  mod: Mod | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { getDownloadSources, downloadFile } = useModsApi()

const sources = ref<DownloadSource[]>([])
const loading = ref(false)
const downloadError = ref<string | null>(null)

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Загружаем источники при открытии
watch(() => props.modelValue, async (newVal) => {
  if (newVal && props.mod) {
    await loadSources()
  }
})

const loadSources = async () => {
  if (!props.mod) return
  
  loading.value = true
  downloadError.value = null
  try {
    console.log(`📡 Загрузка источников для мода ${props.mod.id}`)
    sources.value = await getDownloadSources(props.mod.id)
    console.log(`✅ Загружено ${sources.value.length} источников`)
  } catch (error: any) {
    console.error('❌ Ошибка загрузки источников:', error)
    downloadError.value = error.message
  } finally {
    loading.value = false
  }
}

const formatVersions = (versions?: Array<{ title: string }>): string => {
  if (!versions?.length) return '—'
  return versions.map(v => v.title).join(', ')
}

const formatModLoaders = (loaders?: Array<{ title: string }>): string => {
  if (!loaders?.length) return '—'
  return loaders.map(l => l.title).join(', ')
}

const downloadFileHandler = async (source: DownloadSource) => {
  if (!source.filePath) return
  
  try {
    console.log('📥 Скачивание файла:', source.filePath)
    
    // Извлекаем имя файла из пути
    const fileName = source.filePath.split('/').pop()
    if (!fileName) {
      throw new Error('Не удалось определить имя файла')
    }
    
    const blob = await downloadFile(fileName)
    
    // Создаём ссылку для скачивания
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = source.fileName || fileName
    document.body.appendChild(a)
    a.click()
    
    // Очищаем
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    console.log('✅ Файл успешно скачан')
  } catch (error: any) {
    console.error('❌ Ошибка скачивания:', error)
    alert(`Ошибка скачивания: ${error.message}`)
  }
}

const openUrl = (url: string) => {
  try {
    // Нормализуем URL
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl
    }
    window.open(normalizedUrl, '_blank', 'noopener,noreferrer')
  } catch (error) {
    console.error('❌ Ошибка открытия ссылки:', error)
  }
}

const close = () => {
  show.value = false
}
</script>