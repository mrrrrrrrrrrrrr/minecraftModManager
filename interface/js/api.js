class ModsAPI {
    constructor() {
        this.baseURL = "http://127.0.0.1:5126";
        this.token = localStorage.getItem("jwtToken");
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem("jwtToken", token);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        try {
            const config = {
                headers: {
                    "Content-Type": "application/json",
                },
                ...options
            };

            if (this.token) {
                config.headers["Authorization"] = `Bearer ${this.token}`;
            }

            console.log("Отправка запроса...");

            // таймаут для диагностики
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            config.signal = controller.signal;

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.log("Текст ошибки:", errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const contentType = response.headers.get("content-type");
            console.log("Content-Type:", contentType);

            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                console.log("Успешный ответ:", data);
                return data;
            } else {
                console.log("Пустой ответ");
                return { success: true, status: response.status };
            }

        } catch (error) {
            console.error("Критическая ошибка fetch:");
            console.error("Тип ошибки:", error.name);
            console.error("Сообщение:", error.message);

            if (error.name === 'AbortError') {
                throw new Error("Таймаут запроса: сервер не ответил за 10 секунд");
            }
            if (error.name === 'TypeError') {
                throw new Error(`Network error: ${error.message}. Проверьте URL: ${url}`);
            }
            throw error;
        }
    }

    // аутентификация
    async login(credentials) {
        return this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials)
        });
    }

    async register(userData) {
        console.log("Register attempt with data:", userData);
        return this.request("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData)
        });
    }

    // моды
    async getMods(page = 1, pageSize = 3, search = "") {
        const params = new URLSearchParams({
            pageNumber: page.toString(),
            pageSize: pageSize.toString()
        });

        if (search) {
            params.append("search", search);
        }

        const response = await this.request(`/mods?${params}`);

        console.log("API mods response:", {
            url: `/mods?${params}`,
            itemsCount: response.items?.length || 0,
            totalCount: response.totalCount,
            fullResponse: response
        });

        return response;
    }

    async createMod(modData) {
        console.log("Создание мода:", modData);

        return this.request("/mods", {
            method: "POST",
            body: JSON.stringify(modData)
        });
    }

    async updateMod(modId, modData) {
        try {
            console.log("Обновление мода:", modId, modData);

            const response = await fetch(`${this.baseURL}/mods/${modId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.token}`
                },
                body: JSON.stringify(modData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            console.log("Мод обновлен:", result);
            return result;

        } catch (error) {
            console.error("Ошибка обновления мода:", error);
            throw error;
        }
    }

    async searchMods(queryParams) {
        const params = new URLSearchParams();

        // Базовые параметры пагинации
        params.append('pageNumber', queryParams.pageNumber || 1);
        params.append('pageSize', queryParams.pageSize || 3); // 3 мода на страницу для грида

        // Параметры сортировки
        if (queryParams.sortBy) {
            params.append('sortBy', queryParams.sortBy);
        }
        if (queryParams.orderBy) {
            params.append('orderBy', queryParams.orderBy);
        }

        // Текстовый поиск
        if (queryParams.search) {
            params.append('search', queryParams.search);
        }

        // Фильтрация по типу (boolean)
        if (queryParams.isClientside !== undefined) {
            params.append('isClientside', queryParams.isClientside);
        }

        // Фильтрация по скачиваниям (минимальное значение)
        if (queryParams.minDownloads > 0) {
            params.append('minDownloads', queryParams.minDownloads);
        }

        // Фильтрация по размеру (максимальное значение)
        if (queryParams.maxSize > 0) {
            params.append('maxSize', queryParams.maxSize);
        }

        // Массивы ID - множественные параметры
        ['versionIds', 'modLoaderIds', 'tagIds', 'developers'].forEach(paramName => {
            if (queryParams[paramName] && Array.isArray(queryParams[paramName]) && queryParams[paramName].length > 0) {
                queryParams[paramName].forEach(id => {
                    params.append(paramName, id);
                });
            }
        });

        console.log('Search params:', params.toString());
        return this.request(`/mods?${params}`);
    }


    // коллекции
    async getCollections(page = 1, pageSize = 50, search = "") {
        const params = new URLSearchParams({ pageNumber: page.toString(), pageSize: pageSize.toString() });
        if (search) {
            params.append("search", search);
        }


        const response = await this.request(`/collections?${params}`);
        return response;
    }


    async createCollection(collectionData) {
        return this.request("/collections", {
            method: "POST",
            body: JSON.stringify(collectionData)
        });
    }


    async updateCollection(collectionId, collectionData) {
        return this.request("/collections/${collectionId}", {
            method: "PUT",
            body: JSON.stringify(collectionData)
        });
    }


    async deleteCollection(collectionId) {
        return this.request("/collections/${collectionId}", {
            method: "DELETE"
        });
    }


    async getModById(modId) {
        return this.request(`/mods/${modId}`);
    }

    // справочники - получение
    async getVersions() {
        return this.request("/versions?pageNumber=1&pageSize=100");
    }

    async getModLoaders() {
        return this.request("/modloaders?pageNumber=1&pageSize=100");
    }

    async getTags() {
        return this.request("/tags?pageNumber=1&pageSize=100");
    }

    async getDevelopers() {
        return this.request("/developers?pageNumber=1&pageSize=100");
    }

    async getDifficulties() {
        return this.request("/difficulties?pageNumber=1&pageSize=100");
    }

    async getFocuses() {
        return this.request("/focuses?pageNumber=1&pageSize=100");
    }

    async renameModFile(oldFileName, versionIds, modLoaderIds, modId) {
        console.log("Переименование файла:", {
            oldFileName,
            versionIds,
            modLoaderIds,
            modId
        });

        const formData = new FormData();
        formData.append("oldFileName", oldFileName);
        formData.append("versionIds", JSON.stringify(versionIds));
        formData.append("modLoaderIds", JSON.stringify(modLoaderIds));
        formData.append("modId", modId);

        try {
            console.log("Отправляем запрос на /Upload/mods/rename...");

            const response = await fetch(`${this.baseURL}/Upload/mods/rename`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${this.token}`
                },
                body: formData
            });

            console.log("Ответ получен. Статус:", response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Ошибка сервера:", errorText);
                throw new Error(`Ошибка переименования файла: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log("Файл успешно переименован! Результат:", result);
            return result;

        } catch (error) {
            console.error("Критическая ошибка переименования:", error);
            throw error;
        }
    }

    // справочники - создание
    async createVersion(versionData) {
        return this.request("/versions", {
            method: "POST",
            body: JSON.stringify(versionData)
        });
    }

    async createModLoader(modLoaderData) {
        return this.request("/modloaders", {
            method: "POST",
            body: JSON.stringify(modLoaderData)
        });
    }

    async createTag(tagData) {
        return this.request("/tags", {
            method: "POST",
            body: JSON.stringify(tagData)
        });
    }

    async createDeveloper(developerData) {
        return this.request("/developers", {
            method: "POST",
            body: JSON.stringify(developerData)
        });
    }

    async createDifficulty(difficultyData) {
        return this.request("/difficulties", {
            method: "POST",
            body: JSON.stringify(difficultyData)
        });
    }

    async createFocus(focusData) {
        return this.request("/focuses", {
            method: "POST",
            body: JSON.stringify(focusData)
        });
    }

    async uploadModFile(file, versionIds, modLoaderIds, modId) {
        console.log("Начинаем загрузку файла");
        console.log("Файл:", file.name, file.size, file.type);
        console.log("VersionIds:", versionIds);
        console.log("ModLoaderIds:", modLoaderIds);
        console.log("ModId:", modId);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("versionIds", JSON.stringify(versionIds));
        formData.append("modLoaderIds", JSON.stringify(modLoaderIds));

        if (modId) {
            formData.append("modId", modId);
            console.log("Передаем ModId в запросе:", modId);
        }

        try {
            console.log("Отправляем запрос на /Upload/mod-file...");

            const response = await fetch(`${this.baseURL}/Upload/mod-file`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.token}`
                },
                body: formData
            });

            console.log("Ответ получен. Статус:", response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Ошибка сервера:", errorText);
                throw new Error(`Ошибка загрузки файла: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log("Файл успешно загружен! Результат:", result);
            return result;

        } catch (error) {
            console.error("Критическая ошибка:", error);
            throw error;
        }
    }

    async downloadModFile(fileName) {
        const response = await fetch(`${this.baseURL}/Upload/mods/${fileName}`);

        if (!response.ok) {
            throw new Error(`Ошибка скачивания: ${response.status}`);
        }

        return await response.blob();
    }

    async deleteModFile(fileName) {
        return this.request(`/Upload/mods/${fileName}`, {
            method: "DELETE"
        });
    }

    async createDownloadSource(modId, sourceData) {
        // убедись что modId передается в теле запроса
        const dataWithModId = {
            ...sourceData,
            modId: modId
        };

        console.log("Создание источника в БД:", dataWithModId);

        return this.request("/download-sources", {
            method: "POST",
            body: JSON.stringify(dataWithModId)
        });
    }

    async getModDownloadSources(modId, page = 1, pageSize = 100) {
        const params = new URLSearchParams({
            pageNumber: page.toString(),
            pageSize: pageSize.toString(),
            modId: modId // добавить фильтрацию по modId
        });

        return this.request(`/download-sources?${params}`);
    }

    async updateDownloadSource(sourceId, sourceData) {
        return this.request(`/download-sources/${sourceId}`, {
            method: "PUT",
            body: JSON.stringify(sourceData)
        });
    }

    async deleteDownloadSource(sourceId) {
        return this.request(`/download-sources/${sourceId}`, {
            method: "DELETE"
        });
    }

    async getDownloadSourcesByModId(modId) {
        return this.request(`/download-sources/mod/${modId}`);
    }

    // удаление мода
    async deleteMod(modId) {
        return this.request(`/mods/${modId}`, {
            method: "DELETE"
        });
    }

    // мод галерея
    async getModGallery(modId) {
        return this.request(`/modgalleries/mod/${modId}`);
    }

    async createModGallery(galleryData) {
        return this.request("/modgalleries", {
            method: "POST",
            body: JSON.stringify(galleryData)
        });
    }

    async updateModGallery(imageId, galleryData) {
        return this.request(`/modgalleries/${imageId}`, {
            method: "PUT",
            body: JSON.stringify(galleryData)
        });
    }

    async deleteModGallery(imageId) {
        return this.request(`/modgalleries/${imageId}`, {
            method: "DELETE"
        });
    }

    async deleteModGalleryByModId(modId) {
        return this.request(`/modgalleries/mod/${modId}`, {
            method: "DELETE"
        });
    }
}

const api = new ModsAPI();