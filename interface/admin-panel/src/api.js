const API_BASE = 'http://localhost:5126'
//храним токен авторизации
let authToken = localStorage.getItem('token') || ''
// Утилита для запросов с авторизацией
const authFetch = (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  
  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  }).then(async response => {
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error)
    }
    return response.json()
  })
}

// Функция для установки токена
export const setAuthToken = (token) => {
  authToken = token
  localStorage.setItem('token', token)
}

// Функция для удаления токена
export const clearAuthToken = () => {
  authToken = ''
  localStorage.removeItem('token')
}

// API для аутентификации
export const authApi = {
  login(credentials) {
    return fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
    .then(async response => {
      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }
      return response.json()
    })
  },
  
  register(userData) {
    return fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    .then(async response => {
      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }
      return response.json()
    })
  }
}

// API для модов (исправленная версия для QueryParamsDto)
export const modsApi = {
  // Простая версия без пагинации
  getAll() {
    return authFetch('/mods/getAll')
  },
  
// В api.js добавьте в modsApi:
searchMods(params = {}) {
  const queryParams = new URLSearchParams()
  
  // Базовые параметры пагинации
  queryParams.append('pageNumber', params.pageNumber || 1)
  queryParams.append('pageSize', params.pageSize || 10)
  
  // Параметры сортировки
  if (params.sortBy) {
    queryParams.append('sortBy', params.sortBy)
  }
  if (params.orderBy) {
    queryParams.append('orderBy', params.orderBy)
  }
  
  // Текстовый поиск
  if (params.search) {
    queryParams.append('search', params.search)
  }
  
  // Фильтрация по типу
  if (params.isClientside !== undefined && params.isClientside !== null) {
    queryParams.append('isClientside', params.isClientside)
  }
  
  // Фильтрация по скачиваниям
  if (params.minDownloads > 0) {
    queryParams.append('minDownloads', params.minDownloads)
  }
  
  // Фильтрация по размеру
  if (params.maxSize > 0) {
    queryParams.append('maxSize', params.maxSize)
  }
  
  // Массивы ID - множественные параметры
  const arrayParams = ['versionIds', 'modLoaderIds', 'tagIds', 'developers']
  arrayParams.forEach(paramName => {
    if (params[paramName] && Array.isArray(params[paramName]) && params[paramName].length > 0) {
      params[paramName].forEach(id => {
        queryParams.append(paramName, id)
      })
    }
  })
  
  console.log('🔍 Параметры поиска:', queryParams.toString())
  return authFetch(`/mods?${queryParams.toString()}`)
},

  // Пагинация с QueryParamsDto
  getByPage(params = {}) {
    // Создаем QueryParamsDto объект
    const queryParams = {
      pageNumber: params.pageNumber || 1,
      pageSize: params.pageSize || 10,
      search: params.search || '',
      sortBy: params.sortBy || 'CreatedAt',
      orderBy: params.orderBy || 'desc'
    }
    
    // Преобразуем в строку параметров
    const queryString = new URLSearchParams({
      pageNumber: queryParams.pageNumber,
      pageSize: queryParams.pageSize,
      search: queryParams.search,
      sortBy: queryParams.sortBy,
      orderBy: queryParams.orderBy
    }).toString()
    
    console.log('Отправляем параметры:', queryString)
    return authFetch(`/mods?${queryString}`)
  },
  
  // Альтернатива: отправляем как JSON в body
  getByPageJson(params = {}) {
    const queryParams = {
      pageNumber: params.pageNumber || 1,
      pageSize: params.pageSize || 10,
      search: params.search || '',
      sortBy: params.sortBy || 'CreatedAt',
      orderBy: params.orderBy || 'desc'
    }
    
    return authFetch('/mods/by-page', {
      method: 'POST',
      body: JSON.stringify(queryParams)
    })
  },
  
  getById(id) {
    return authFetch(`/mods/${id}`)
  },
  
  create(modData) {
    return authFetch('/mods', {
      method: 'POST',
      body: JSON.stringify(modData)
    })
  },
  
  update(id, modData) {
    return authFetch(`/mods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(modData)
    })
  },
  
  delete(id) {
    return authFetch(`/mods/${id}`, {
      method: 'DELETE'
    })
  }
}

// Для получения справочных данных
export const referencesApi = {
  getVersions() {
    return authFetch('/versions/getAll')
  },
  
  getModLoaders() {
    return authFetch('/modLoaders/getAll')
  },
  
  getTags() {
    return authFetch('/tags/getAll')
  },
  
  getDevelopers() {
    return authFetch('/developers/getAll')
  },
  
  getFocuses() {
    return authFetch('/focuses/getAll')
  },
  
  getDifficulties() {
    return authFetch('/difficulties/getAll')
  },
  
  getCollections() {
    return authFetch('/collections/getAll')
  }
}

// API для быстрого добавления сущностей
export const quickAddApi = {
  // Создание версии
  async createVersion(versionData) {
    return authFetch('/versions', {
      method: 'POST',
      body: JSON.stringify(versionData)
    })
  },
  
  // Создание загрузчика модов
  async createModLoader(modLoaderData) {
    return authFetch('/modloaders', {
      method: 'POST',
      body: JSON.stringify(modLoaderData)
    })
  },
  
  // Создание тега
  async createTag(tagData) {
    return authFetch('/tags', {
      method: 'POST',
      body: JSON.stringify(tagData)
    })
  },
  
  // Создание разработчика
  async createDeveloper(developerData) {
    return authFetch('/developers', {
      method: 'POST',
      body: JSON.stringify(developerData)
    })
  },
  
  // Создание сложности
  async createDifficulty(difficultyData) {
    return authFetch('/difficulties', {
      method: 'POST',
      body: JSON.stringify(difficultyData)
    })
  },
  
  // Создание фокуса
  async createFocus(focusData) {
    return authFetch('/focuses', {
      method: 'POST',
      body: JSON.stringify(focusData)
    })
  }
}



// Для работы с источниками
// В конец api.js (после quickAddApi) добавляем:

// API для загрузки файлов (РАБОЧАЯ ВЕРСИЯ)
export const filesApi = {
  async uploadModFile(file, versionIds, modLoaderIds, modId) {
    console.log("📁 Загрузка файла:", file.name);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("versionIds", JSON.stringify(versionIds));
    formData.append("modLoaderIds", JSON.stringify(modLoaderIds));

    if (modId) {
      formData.append("modId", modId);
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/Upload/mod-file`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка загрузки файла: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  async downloadModFile(fileName) {
  const response = await fetch(`${API_BASE}/Upload/mods/${fileName}`, {
    headers: {
      'Authorization': authToken ? `Bearer ${authToken}` : ''
    }
  });

  if (!response.ok) {
    throw new Error(`Ошибка скачивания: ${response.status}`);
  }

  return await response.blob();
},

  async deleteModFile(fileName) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/Upload/mods/${fileName}`, {
      method: "DELETE",
      headers: {
        "Authorization": token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка удаления файла: ${response.status} - ${errorText}`);
    }
  },

  async uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/Upload/image`, {
      method: "POST",
      headers: {
        "Authorization": token ? `Bearer ${token}` : ''
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка загрузки изображения: ${response.status} - ${errorText}`);
    }

    return await response.text();
  },

  async deleteImage(fileName) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/Upload/delete-image/${fileName}`, {
      method: "DELETE",
      headers: {
        "Authorization": token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка удаления изображения: ${response.status} - ${errorText}`);
    }
  },

  async uploadGalleryImage(file, modId) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("modId", modId);

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/Upload/gallery-image`, {
    method: "POST",
    headers: {
      "Authorization": token ? `Bearer ${token}` : ''
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка загрузки изображения галереи: ${response.status} - ${errorText}`);
  }

  return await response.text();
},

async deleteGalleryImage(fileName) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/Upload/gallery-image/${fileName}`, {
    method: "DELETE",
    headers: {
      "Authorization": token ? `Bearer ${token}` : ''
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка удаления изображения галереи: ${response.status} - ${errorText}`);
  }
}
};

// API для источников скачивания (РАБОЧАЯ ВЕРСИЯ)
export const sourcesApi = {
  async create(modId, sourceData) {
    const dataWithModId = {
      ...sourceData,
      modId: modId
    };

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/download-sources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(dataWithModId)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка создания источника: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  async update(sourceId, sourceData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/download-sources/${sourceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(sourceData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка обновления источника: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  async delete(sourceId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/download-sources/${sourceId}`, {
      method: "DELETE",
      headers: {
        "Authorization": token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка удаления источника: ${response.status} - ${errorText}`);
    }
  },

  async getByModId(modId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/download-sources/mod/${modId}`, {
      headers: {
        "Authorization": token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка загрузки источников: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
};

// API для управления сущностями (удаление/редактирование)
export const entitiesApi = {
  // Удаление версии
  async deleteVersion(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/versions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка удаления версии: ${response.status} - ${errorText}`);
    }
  },

  // Удаление загрузчика
  async deleteModLoader(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/modloaders/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка удаления загрузчика: ${response.status} - ${errorText}`);
    }
  },

  // Удаление тега
  async deleteTag(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/tags/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка удаления тега: ${response.status} - ${errorText}`);
    }
  },

  // Удаление разработчика
  async deleteDeveloper(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/developers/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка удаления разработчика: ${response.status} - ${errorText}`);
    }
  },

  // Удаление сложности
  async deleteDifficulty(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/difficulties/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка удаления сложности: ${response.status} - ${errorText}`);
    }
  },

  // Удаление фокуса
  async deleteFocus(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/focuses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка удаления фокуса: ${response.status} - ${errorText}`);
    }
  },

  // Обновление сущностей
  async updateVersion(id, data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/versions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка обновления версии: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  async updateModLoader(id, data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/modloaders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка обновления загрузчика: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  async updateTag(id, data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/tags/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка обновления тега: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  async updateDeveloper(id, data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/developers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка обновления разработчика: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  async updateDifficulty(id, data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/difficulties/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка обновления сложности: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  async updateFocus(id, data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/focuses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка обновления фокуса: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
};

// API для галереи модов
export const galleriesApi = {
  async getByModId(modId) {
    return authFetch(`/modgalleries/mod/${modId}`);
  },
  
  async create(galleryData) {
    return authFetch('/modgalleries', {
      method: 'POST',
      body: JSON.stringify(galleryData)
    });
  },
  
  async delete(id) {
    return authFetch(`/modgalleries/${id}`, {
      method: 'DELETE'
    });
  },
  
  async update(id, galleryData) {
    return authFetch(`/modgalleries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(galleryData)
    });
  }
};