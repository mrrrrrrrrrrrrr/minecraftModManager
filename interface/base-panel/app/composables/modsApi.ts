// composables/useModsApi.ts
const API_BASE = 'http://localhost:5126'

// Типы данных
export interface Mod {
  id: string
  title: string
  description?: string
  size: number
  downloads: number
  isClientside: boolean
  imageUrl?: string
  createdAt: string
  updatedAt: string
  versions?: Array<{ id: string; title: string }>
  modLoaders?: Array<{ id: string; title: string }>
  tags?: Array<{ id: string; title: string }>
  developers?: Array<{ id: string; nickname: string }>
}

export interface DownloadSource {
  id: string
  title: string
  url?: string
  filePath?: string
  fileName?: string
  fileSize?: number
  versions?: Array<{ id: string; title: string }>
  modLoaders?: Array<{ id: string; title: string }>
}

export interface ModGalleryImage {
  id: string
  imageUrl: string
  fileName: string
  displayOrder: number
  modId: string
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

// Типы для справочных данных
export interface Version {
  id: string
  title: string
}

export interface ModLoader {
  id: string
  title: string
}

export interface Tag {
  id: string
  title: string
}

export interface Developer {
  id: string
  nickname: string
}

// Простая функция получения токена - работает только в браузере
const getToken = (): string | null => {
  // Проверяем, что мы в браузере
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('token')
  }
  return null
}

// Утилита для запросов с авторизацией
const authFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  // 🔥 Исправление: создаём объект headers как Record<string, string>
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`
  
  console.log(`📡 Запрос: ${fullUrl}`)

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Ошибка ${response.status}:`, errorText)
      throw new Error(errorText || `HTTP ${response.status}`)
    }

    // Для пустых ответов (204 No Content)
    if (response.status === 204) {
      return {} as T
    }

    // Проверяем, есть ли контент
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    } else {
      return {} as T
    }
  } catch (error) {
    console.error('❌ Fetch error:', error)
    throw error
  }
}

// Функция для установки токена (если потребуется)
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('token', token)
  }
}

// Функция для удаления токена
export const clearAuthToken = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('token')
  }
}

// API для модов
export const useModsApi = () => {
  return {
    // Получить все моды (простая версия)
    getAllMods: () => 
      authFetch<Mod[]>('/mods/getAll'),

    // Поиск с пагинацией и фильтрацией
    searchMods: (params: {
      pageNumber?: number
      pageSize?: number
      search?: string
      sortBy?: string
      orderBy?: string
      isClientside?: boolean
      minDownloads?: number
      maxSize?: number
      versionIds?: string[]
      modLoaderIds?: string[]
      tagIds?: string[]
      developers?: string[]
    } = {}) => {
      const queryParams = new URLSearchParams()

      // Базовые параметры пагинации
      queryParams.append('pageNumber', String(params.pageNumber || 1))
      queryParams.append('pageSize', String(params.pageSize || 12))

      // Параметры сортировки
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.orderBy) queryParams.append('orderBy', params.orderBy)

      // Текстовый поиск
      if (params.search) queryParams.append('search', params.search)

      // Фильтрация по типу
      if (params.isClientside !== undefined && params.isClientside !== null) {
        queryParams.append('isClientside', String(params.isClientside))
      }

      // Фильтрация по скачиваниям
      if (params.minDownloads && params.minDownloads > 0) {
        queryParams.append('minDownloads', String(params.minDownloads))
      }

      // Фильтрация по размеру
      if (params.maxSize && params.maxSize > 0) {
        queryParams.append('maxSize', String(params.maxSize))
      }

      // Массивы ID - множественные параметры
      const arrayParams = ['versionIds', 'modLoaderIds', 'tagIds', 'developers'] as const
      arrayParams.forEach(paramName => {
        const values = params[paramName]
        if (Array.isArray(values) && values.length > 0) {
          values.forEach(id => {
            queryParams.append(paramName, String(id))
          })
        }
      })

      const url = `/mods?${queryParams.toString()}`
      console.log('🔍 Параметры поиска:', queryParams.toString())
      return authFetch<PaginatedResponse<Mod>>(url)
    },

    // Получить по странице (альтернативный метод)
    getModsByPage: (page = 1, pageSize = 12, search = '') => {
      const queryParams = new URLSearchParams({
        pageNumber: String(page),
        pageSize: String(pageSize),
        search: search,
        sortBy: 'CreatedAt',
        orderBy: 'desc'
      })
      return authFetch<PaginatedResponse<Mod>>(`/mods?${queryParams.toString()}`)
    },

    // Получить мод по ID
    getModById: (id: string) => 
      authFetch<Mod>(`/mods/${id}`),

    // Получить галерею мода
    getModGallery: (modId: string) => 
      authFetch<ModGalleryImage[]>(`/modgalleries/mod/${modId}`),

    // Получить источники скачивания
    getDownloadSources: (modId: string) => 
      authFetch<DownloadSource[]>(`/download-sources/mod/${modId}`),

    // Скачать файл
    downloadFile: async (fileName: string): Promise<Blob> => {
      const token = getToken()
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`${API_BASE}/Upload/mods/${fileName}`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`Ошибка скачивания: ${response.status}`)
      }

      return await response.blob()
    },

    // Получить URL изображения (полный путь)
    getImageUrl: (imageUrl?: string): string => {
      if (!imageUrl) return ''
      if (imageUrl.startsWith('http')) return imageUrl
      if (imageUrl.startsWith('/')) return `${API_BASE}${imageUrl}`
      return `${API_BASE}/${imageUrl}`
    },

    // ========== НОВЫЕ МЕТОДЫ ДЛЯ СПРАВОЧНЫХ ДАННЫХ ==========
    
    // Получить все версии
    getVersions: () => 
      authFetch<Version[]>('/versions/getAll'),

    // Получить все модлоадеры
    getModLoaders: () => 
      authFetch<ModLoader[]>('/modLoaders/getAll'),

    // Получить все теги
    getTags: () => 
      authFetch<Tag[]>('/tags/getAll'),

    // Получить всех разработчиков
    getDevelopers: () => 
      authFetch<Developer[]>('/developers/getAll'),
  }
}

// Экспортируем отдельно для гибкости
export const modsApi = {
  getAll: () => authFetch<Mod[]>('/mods/getAll'),
  search: (params?: any) => {
    const api = useModsApi()
    return api.searchMods(params)
  }
}

export const filesApi = {
  downloadModFile: async (fileName: string) => {
    const api = useModsApi()
    return api.downloadFile(fileName)
  }
}

export const galleriesApi = {
  getByModId: (modId: string) => {
    const api = useModsApi()
    return api.getModGallery(modId)
  }
}

export const sourcesApi = {
  getByModId: (modId: string) => {
    const api = useModsApi()
    return api.getDownloadSources(modId)
  }
}

// ========== НОВЫЕ ЭКСПОРТЫ ДЛЯ СПРАВОЧНЫХ ДАННЫХ ==========
export const referencesApi = {
  getVersions: () => {
    const api = useModsApi()
    return api.getVersions()
  },
  getModLoaders: () => {
    const api = useModsApi()
    return api.getModLoaders()
  },
  getTags: () => {
    const api = useModsApi()
    return api.getTags()
  },
  getDevelopers: () => {
    const api = useModsApi()
    return api.getDevelopers()
  }
}