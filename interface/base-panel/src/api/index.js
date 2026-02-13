import client from './client.js'

// Моды
export const modsApi = {
    searchMods: async (params) => {
        const response = await client.get('/api/mods/search', { params })
        return response.data
    },
    
    getById: async (id) => {
        const response = await client.get(`/api/mods/${id}`)
        return response.data
    },
    
    // getAll - если search не работает
    getAll: async () => {
        const response = await client.get('/api/mods')
        return response.data
    }
}

// Справочные данные для фильтров
export const referencesApi = {
    getVersions: async () => {
        const response = await client.get('/api/versions')
        return response.data
    },
    
    getModLoaders: async () => {
        const response = await client.get('/api/modloaders')
        return response.data
    },
    
    getTags: async () => {
        const response = await client.get('/api/tags')
        return response.data
    },
    
    getDevelopers: async () => {
        const response = await client.get('/api/developers')
        return response.data
    }
}

// Галерея
export const galleriesApi = {
    getByModId: async (modId) => {
        const response = await client.get(`/api/galleries/mod/${modId}`)
        return response.data
    }
}

// Источники скачивания
export const sourcesApi = {
    getByModId: async (modId) => {
        const response = await client.get(`/api/sources/mod/${modId}`)
        return response.data
    }
}

// Файлы
export const filesApi = {
    downloadModFile: async (fileName) => {
        const response = await client.get(`/api/files/download/${fileName}`, {
            responseType: 'blob'
        })
        return response.data
    }
}