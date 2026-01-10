/**
 * Взаимодействие с API пользовательского интерфейса
 * Методы для работы с API: создание, обновление, загрузка данных
 */

// Блок: Создание и обновление модов
// =================================

/**
 * Создание нового мода с обработкой изображений и файлов
 * @param {Object} modData - данные мода из формы
 */
UIManager.prototype.createMod = async function (modData) {
    try {
        console.log("Начало создания мода...");

        // проверка обязательных полей
        if (!modData["mod-versions"] || modData["mod-versions"].length === 0) {
            this.showMessage("Выберите хотя бы одну версию!", "error");
            return;
        }

        if (!modData["mod-loaders"] || modData["mod-loaders"].length === 0) {
            this.showMessage("Выберите хотя бы один модлоадер!", "error");
            return;
        }

        // загрузка изображения мода, если оно есть
        let imageUrl = null;
        const imageFile = modData["mod-image"];
        if (imageFile) {
            console.log("Загружаем изображение мода...", imageFile.name);
            imageUrl = await this.uploadImageToServer(imageFile);
            console.log("Изображение загружено:", imageUrl);
        }

        // подготовка данных для API (без файлов)
        const apiData = {
            title: modData["mod-title"],
            description: modData["mod-description"] || "",
            size: modData["mod-size"],
            downloads: modData["mod-downloads"],
            isClientside: modData["mod-clientside"],
            versionIds: modData["mod-versions"],
            modLoaderIds: modData["mod-loaders"],
            tagIds: modData["mod-tags"] || [],
            developerIds: modData["mod-developers"] || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (imageUrl) {
            apiData.imageUrl = imageUrl;
        }

        console.log("Отправка данных мода на сервер (без файлов):", apiData);

        // создание мода на сервере
        const result = await api.createMod(apiData);
        console.log("Мод создан с ID:", result.id);

        // загрузка файлов с настоящим mod ID после создания мода
        if (modData["download-sources"] && modData["download-sources"].length > 0) {
            console.log("Загружаем файлы с настоящим modId:", result.id);

            for (const source of modData["download-sources"]) {
                if (source.file) {
                    console.log("Загружаем файл источника:", source.file.name);
                    const uploadResult = await api.uploadModFile(
                        source.file,
                        source.versionIds,
                        source.modLoaderIds,
                        result.id
                    );

                    // обновляем источник с результатом загрузки
                    source.filePath = uploadResult.filePath;
                    source.fileName = uploadResult.originalFileName;
                    source.fileSize = uploadResult.fileSize;

                    console.log("Файл загружен:", uploadResult.filePath);
                }
            }

            // привязка источников к моду
            console.log("Привязываем источники к созданному моду:", result.id);
            for (const source of modData["download-sources"]) {
                source.modId = result.id;
            }

            await this.saveDownloadSources(result.id, modData["download-sources"]);
        }

        // загрузка изображений галереи после создания мода
        const galleryFieldId = "mod-gallery";
        if (this.galleryFiles && this.galleryFiles[galleryFieldId] && this.galleryFiles[galleryFieldId].length > 0) {
            console.log("Загружаем изображения галереи...", this.galleryFiles[galleryFieldId]);
            
            const galleryItems = [];
            const galleryFiles = this.galleryFiles[galleryFieldId];
            
            for (let i = 0; i < galleryFiles.length; i++) {
                const galleryItem = galleryFiles[i];
                if (galleryItem.isNew && galleryItem.file) {
                    console.log(`Загружаем изображение ${i + 1}/${galleryFiles.length}: ${galleryItem.file.name}`);
                    
                    try {
                        // загружаем файл на сервер
                        const imageUrl = await this.uploadGalleryImageToServer(galleryItem.file, result.id);
                        
                        // создаем запись для галереи
                        const galleryData = {
                            imageUrl: imageUrl,
                            fileName: galleryItem.file.name,
                            displayOrder: i,
                            modId: result.id
                        };
                        
                        galleryItems.push(galleryData);
                        console.log(`Изображение загружено: ${imageUrl}`);
                        
                    } catch (uploadError) {
                        console.error(`Ошибка загрузки изображения ${galleryItem.file.name}:`, uploadError);
                    }
                }
            }
            
            // сохраняем все элементы галереи в БД
            if (galleryItems.length > 0) {
                console.log("Сохраняем галерею в БД:", galleryItems.length, "изображений");
                
                for (const item of galleryItems) {
                    try {
                        await api.createModGallery(item);
                        console.log("Элемент галереи сохранен:", item.fileName);
                    } catch (dbError) {
                        console.error("Ошибка сохранения элемента галереи:", dbError);
                    }
                }
                
                console.log("Вся галерея сохранена в БД");
                
                // очищаем галерею после успешного сохранения
                this.galleryFiles[galleryFieldId] = [];
                const previewContainer = document.getElementById(`${galleryFieldId}-preview`);
                if (previewContainer) {
                    previewContainer.innerHTML = '';
                }
            }
        } else {
            console.log("Нет изображений галереи для загрузки");
        }

        // завершение операции
        this.closeModal();
        this.showMessage("Мод успешно добавлен!", "success");
        await this.loadAllData();

    } catch (error) {
        console.error("Ошибка создания мода:", error);
        this.showMessage("Ошибка при добавлении мода: " + error.message, "error");
    }
};

/**
 * Обновление существующего мода с полной обработкой файлов и изображений
 * @param {string} modId - идентификатор мода
 * @param {Object} modData - новые данные мода
 */
UIManager.prototype.updateMod = async function (modId, modData) {
    try {
        console.log("Начало обновления мода:", modId);

        // проверка аутентификации
        if (!api.token) {
            this.showMessage("Ошибка авторизации. Попробуйте войти снова.", "error");
            return;
        }

        // валидация обязательных полей
        if (!modData["edit-mod-versions"] || modData["edit-mod-versions"].length === 0) {
            this.showMessage("Выберите хотя бы одну версию!", "error");
            return;
        }

        if (!modData["edit-mod-loaders"] || modData["edit-mod-loaders"].length === 0) {
            this.showMessage("Выберите хотя бы один модлоадер!", "error");
            return;
        }

        // обработка изображения
        let imageUrl = null;
        const imageFile = modData["edit-mod-image"];
        const currentMod = this.mods.find(m => m.id === modId);
        const currentImageUrl = currentMod?.imageUrl;

        console.log("Обработка изображения:", {
            hasNewFile: !!imageFile,
            imageFileType: typeof imageFile,
            currentImageUrl: currentImageUrl
        });

        if (imageFile === null) {
            // пользователь удалил изображение
            console.log("Пользователь удалил изображение мода");
            imageUrl = "";

            // удаляем файл с сервера
            if (currentImageUrl) {
                try {
                    const imageFileName = currentImageUrl.split('/').pop();
                    console.log("Удаляем файл изображения с сервера:", imageFileName);
                    await this.deleteImageFromServer(imageFileName);
                    console.log("Файл изображения удален с сервера");
                } catch (deleteError) {
                    console.error("Ошибка удаления файла изображения:", deleteError);
                }
            }
        }
        else if (imageFile && typeof imageFile === 'object') {
            // новое изображение выбрано
            console.log("Загружаем новое изображение...", imageFile.name);
            imageUrl = await this.uploadImageToServer(imageFile);
            console.log("Новое изображение загружено:", imageUrl);

            // удаляем старое изображение с сервера
            if (currentImageUrl) {
                try {
                    const oldImageFileName = currentImageUrl.split('/').pop();
                    console.log("Удаляем старое изображение:", oldImageFileName);
                    await this.deleteImageFromServer(oldImageFileName);
                    console.log("Старое изображение удалено");
                } catch (deleteError) {
                    console.log("Не удалось удалить старое изображение:", deleteError.message);
                }
            }
        }
        else if (currentImageUrl) {
            // изображение не изменилось - сохраняем текущее
            imageUrl = currentImageUrl;
            console.log("Сохраняем текущее изображение:", imageUrl);
        }

        // подготовка данных для обновления
        const apiData = {
            title: modData["edit-mod-title"],
            description: modData["edit-mod-description"] || "",
            size: modData["edit-mod-size"],
            downloads: modData["edit-mod-downloads"],
            isClientside: modData["edit-mod-clientside"],
            versionIds: modData["edit-mod-versions"],
            modLoaderIds: modData["edit-mod-loaders"],
            tagIds: modData["edit-mod-tags"] || [],
            developerIds: modData["edit-mod-developers"] || [],
            updatedAt: new Date().toISOString()
        };

        if (imageUrl !== null) {
            apiData.imageUrl = imageUrl;
        }

        console.log("Отправка данных для обновления мода:", modId, apiData);

        // обновление мода на сервере
        const result = await api.updateMod(modId, apiData);
        console.log("Мод обновлен");

        // обработка источников скачивания с переименованием файлов
        if (modData["download-sources"] && modData["download-sources"].length > 0) {
            console.log("Обрабатываем источники:", modData["download-sources"]);

            // получаем текущие источники из БД
            const existingSourcesFromDb = await api.getDownloadSourcesByModId(modId);

            const sourcesToCreate = [];
            const sourcesToUpdate = [];

            // разделяем на новые и существующие
            for (const source of modData["download-sources"]) {
                if (!source.id || source.id.startsWith('temp_')) {
                    // новый источник
                    sourcesToCreate.push(source);
                    console.log("Новый источник для создания:", source.title || source.file?.name);
                } else {
                    // существующий источник - обновляем
                    sourcesToUpdate.push(source);
                    console.log("Существующий источник для обновления:", source.id, source.title);
                }
            }

            console.log(`Для создания: ${sourcesToCreate.length}, Для обновления: ${sourcesToUpdate.length}`);

            // создание новых источников
            for (const source of sourcesToCreate) {
                if (source.file || source.url) {
                    let filePath = null;
                    let fileName = null;
                    let fileSize = null;

                    if (source.file) {
                        console.log("Загружаем файл нового источника:", source.file.name);
                        const uploadResult = await api.uploadModFile(
                            source.file,
                            source.versionIds,
                            source.modLoaderIds,
                            modId
                        );

                        filePath = uploadResult.filePath;
                        fileName = source.file.name;
                        fileSize = uploadResult.fileSize;
                    }

                    const sourceData = {
                        title: source.title || `Источник для ${modData["edit-mod-title"]}`,
                        url: source.url || "",
                        filePath: filePath,
                        fileName: fileName,
                        fileSize: fileSize,
                        versionIds: source.versionIds,
                        modLoaderIds: source.modLoaderIds,
                        modId: modId
                    };

                    await api.createDownloadSource(modId, sourceData);
                    console.log("Новый источник создан");
                }
            }

            // обновление существующих источников с переименованием
            for (const source of sourcesToUpdate) {
                console.log("Обновляем существующий источник:", source.id);

                // находим старый источник из БД
                const oldSource = existingSourcesFromDb.find(s => s.id === source.id);
                const oldFilePath = oldSource?.filePath;

                let filePath = oldFilePath;
                let fileName = oldSource?.fileName;
                let fileSize = oldSource?.fileSize;

                // определяем тип изменений
                const hasNewFile = !!source.file;
                const versionsChanged = !this.arraysEqual(source.versionIds, oldSource?.versionIds?.map(v => v.id) || []);
                const loadersChanged = !this.arraysEqual(source.modLoaderIds, oldSource?.modLoaderIds?.map(ml => ml.id) || []);

                console.log("Изменения в источнике:", {
                    hasNewFile,
                    versionsChanged,
                    loadersChanged,
                    oldVersions: oldSource?.versionIds?.map(v => v.id),
                    newVersions: source.versionIds,
                    oldLoaders: oldSource?.modLoaderIds?.map(ml => ml.id),
                    newLoaders: source.modLoaderIds
                });

                if (hasNewFile) {
                    // есть новый файл
                    console.log("Загружаем новый файл:", source.file.name);

                    try {
                        // сначала удаляем старый файл
                        if (oldFilePath) {
                            try {
                                const oldFileName = oldFilePath.split('/').pop();
                                console.log("Удаляем старый файл:", oldFileName);
                                await api.deleteModFile(oldFileName);
                                console.log("Старый файл удален");
                            } catch (deleteError) {
                                console.log("Не удалось удалить старый файл:", deleteError.message);
                            }
                        }

                        // загружаем новый файл
                        const uploadResult = await api.uploadModFile(
                            source.file,
                            source.versionIds,
                            source.modLoaderIds,
                            modId
                        );

                        filePath = uploadResult.filePath;
                        fileName = source.file.name;
                        fileSize = uploadResult.fileSize;
                        console.log("Новый файл загружен:", fileName);

                    } catch (uploadError) {
                        console.error("Ошибка загрузки нового файла:", uploadError);
                        // если загрузка не удалась - сохраняем старый файл
                        filePath = oldFilePath;
                        fileName = oldSource?.fileName;
                        fileSize = oldSource?.fileSize;
                    }
                } else if ((versionsChanged || loadersChanged) && oldFilePath) {
                    // переименование существующего файла при изменении версий/загрузчиков
                    console.log("Переименовываем файл из-за изменений версий/загрузчиков");

                    try {
                        const oldFileName = oldFilePath.split('/').pop();
                        console.log("Переименование файла:", {
                            oldFileName,
                            newVersionIds: source.versionIds,
                            newLoaderIds: source.modLoaderIds,
                            modId
                        });

                        const renameResult = await api.renameModFile(
                            oldFileName,
                            source.versionIds,
                            source.modLoaderIds,
                            modId
                        );

                        filePath = renameResult.filePath;
                        fileName = renameResult.fileName;
                        console.log("Файл переименован:", fileName);

                    } catch (renameError) {
                        console.error("Ошибка переименования файла:", renameError);
                        // если переименование не удалось - сохраняем старый путь
                        filePath = oldFilePath;
                        fileName = oldSource?.fileName;
                    }
                }

                // обновляем существующую запись в БД
                const sourceData = {
                    title: source.title,
                    url: source.url || "",
                    filePath: filePath,
                    fileName: fileName,
                    fileSize: fileSize,
                    versionIds: source.versionIds,
                    modLoaderIds: source.modLoaderIds,
                    modId: modId
                };

                await api.updateDownloadSource(source.id, sourceData);
                console.log("Существующий источник обновлен:", source.id);
            }

            // удаляем источники, которых нет в форме
            const sourcesInForm = modData["download-sources"]
                .filter(s => s.id && !s.id.startsWith('temp_'))
                .map(s => s.id);

            const sourcesToDelete = existingSourcesFromDb.filter(s => !sourcesInForm.includes(s.id));

            console.log(`Источников для удаления: ${sourcesToDelete.length}`);
            for (const source of sourcesToDelete) {
                // удаляем файл при удалении источника
                if (source.filePath) {
                    try {
                        const fileName = source.filePath.split('/').pop();
                        console.log("Удаляем файл удаляемого источника:", fileName);
                        await api.deleteModFile(fileName);
                        console.log("Файл источника удален");
                    } catch (deleteError) {
                        console.log("Не удалось удалить файл:", deleteError.message);
                    }
                }

                await api.deleteDownloadSource(source.id);
                console.log("Удален источник:", source.id);
            }
        } else {
            console.log("Нет источников для обработки");
        }

        // обработка галереи изображений
        const galleryFieldId = "edit-mod-gallery";
        
        // сначала удаляем изображения, помеченные для удаления
        await this.processGalleryRemovals(modId, galleryFieldId);
        
        // затем добавляем новые изображения
        if (this.galleryFiles && this.galleryFiles[galleryFieldId] && this.galleryFiles[galleryFieldId].length > 0) {
            console.log("Обрабатываем галерею изображений...", this.galleryFiles[galleryFieldId]);
            
            // получаем текущую галерею из БД (после удалений)
            const currentGallery = await api.getModGallery(modId);
            console.log("Текущая галерея в БД после удалений:", currentGallery.length, "изображений");
            
            const galleryFiles = this.galleryFiles[galleryFieldId];
            const galleryItems = [];
            
            for (let i = 0; i < galleryFiles.length; i++) {
                const galleryItem = galleryFiles[i];
                if (galleryItem.isNew && galleryItem.file && !galleryItem.isRemoved) {
                    console.log(`Загружаем новое изображение галереи ${i + 1}/${galleryFiles.length}: ${galleryItem.file.name}`);
                    
                    try {
                        // загружаем файл на сервер
                        const imageUrl = await this.uploadGalleryImageToServer(galleryItem.file, modId);
                        
                        // создаем запись для галереи
                        const galleryData = {
                            imageUrl: imageUrl,
                            fileName: galleryItem.file.name,
                            displayOrder: currentGallery.length + i,
                            modId: modId
                        };
                        
                        galleryItems.push(galleryData);
                        console.log(`Изображение галереи загружено: ${imageUrl}`);
                        
                    } catch (uploadError) {
                        console.error(`Ошибка загрузки изображения галереи ${galleryItem.file.name}:`, uploadError);
                    }
                }
            }
            
            // сохраняем новые элементы галереи в БД
            if (galleryItems.length > 0) {
                console.log("Сохраняем новые изображения галереи в БД:", galleryItems.length);
                
                for (const item of galleryItems) {
                    try {
                        await api.createModGallery(item);
                        console.log("Элемент галереи сохранен:", item.fileName);
                    } catch (dbError) {
                        console.error("Ошибка сохранения элемента галереи:", dbError);
                    }
                }
                
                console.log("Новая галерея сохранена в БД");
            }
            
            // обновляем порядок отображения для всех изображений
            await this.updateGalleryDisplayOrder(modId);
            
            // очищаем галерею после успешного сохранения
            this.galleryFiles[galleryFieldId] = [];
            const previewContainer = document.getElementById(`${galleryFieldId}-preview`);
            if (previewContainer) {
                previewContainer.innerHTML = '';
            }
        } else {
            console.log("Нет новых изображений галереи для загрузки");
        }

        // завершение
        this.closeModal();
        this.showMessage("Мод успешно обновлен!", "success");
        await this.loadAllData();

    } catch (error) {
        console.error("Ошибка обновления мода:", error);
        this.showMessage("Ошибка при обновлении мода: " + error.message, "error");
    }
};

// Блок: Вспомогательные методы
// ============================

/**
 * Сравнение двух массивов
 * @param {Array} arr1 - первый массив
 * @param {Array} arr2 - второй массив
 * @returns {boolean} true если массивы равны
 */
UIManager.prototype.arraysEqual = function (arr1, arr2) {
    if (!arr1 || !arr2) return false;
    if (arr1.length !== arr2.length) return false;
    
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    
    return sorted1.every((value, index) => value === sorted2[index]);
};

/**
 * Обновление порядка отображения галереи
 * @param {string} modId - идентификатор мода
 */
UIManager.prototype.updateGalleryDisplayOrder = async function (modId) {
    try {
        const gallery = await api.getModGallery(modId);
        
        // сортируем по displayOrder и обновляем если нужно
        const sortedGallery = gallery.sort((a, b) => a.displayOrder - b.displayOrder);
        
        for (let i = 0; i < sortedGallery.length; i++) {
            if (sortedGallery[i].displayOrder !== i) {
                const updateData = {
                    id: sortedGallery[i].id,
                    imageUrl: sortedGallery[i].imageUrl,
                    fileName: sortedGallery[i].fileName,
                    displayOrder: i
                };
                
                await api.updateModGallery(sortedGallery[i].id, updateData);
            }
        }
        
        console.log("Порядок отображения галереи обновлен");
    } catch (error) {
        console.error("Ошибка обновления порядка галереи:", error);
    }
};

/**
 * Вспомогательный метод для получения файла из пути
 * @param {string} filePath - путь к файлу
 * @returns {Promise<File|null>} объект файла или null
 */
UIManager.prototype.getFileFromPath = async function (filePath) {
    console.log("Переименование файлов без перезагрузки не поддерживается");
    return null;
};

// Блок: Работа с источниками скачивания
// =====================================

/**
 * Сохранение источников скачивания для мода
 * @param {string} modId - ID мода
 * @param {Array} sources - массив источников скачивания
 */
UIManager.prototype.saveDownloadSources = async function (modId, sources) {
    try {
        console.log("Сохранение источников в БД:", {
            modId: modId,
            sourcesCount: sources.length,
            sources: sources
        });

        // последовательное сохранение каждого источника
        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];
            console.log(`Сохраняем источник ${i + 1}/${sources.length}:`, source);

            // подготовка данных источника
            const sourceData = {
                title: source.title,
                url: source.url,
                filePath: source.filePath,
                fileName: source.fileName,
                fileSize: source.fileSize,
                versionIds: source.versionIds,
                modLoaderIds: source.modLoaderIds,
                modId: modId
            };

            try {
                // сохранение источника на сервере
                const result = await api.createDownloadSource(modId, sourceData);
                console.log(`Источник ${i + 1} сохранен:`, result);
            }
            catch (error) {
                console.error(`Ошибка сохранения источника ${i + 1}:`, error);
                throw error;
            }
        }

        console.log("Все источники успешно сохранены в БД!");
    }
    catch (error) {
        console.error("Критическая ошибка сохранения:", error);
        throw error;
    }
};

// Блок: Работа с изображениями
// =============================

/**
 * Удаление изображения с сервера
 * @param {string} fileName - имя файла для удаления
 */
UIManager.prototype.deleteImageFromServer = async function (fileName) {
    try {
        console.log("Удаление изображения с сервера:", fileName);

        // если файл находится в папке uploads
        const response = await fetch(`${api.baseURL}/Upload/delete-image/${fileName}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${api.token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Ошибка удаления изображения:", errorText);
            throw new Error(`Ошибка удаления изображения: ${response.status} - ${errorText}`);
        }

        console.log("Изображение успешно удалено с сервера");
        return true;
    } catch (error) {
        console.error("Критическая ошибка удаления изображения:", error);
        throw error;
    }
};

// Блок: Загрузка данных
// ======================

/**
 * Загрузка всех данных приложения: моды, коллекции и справочные данные
 */
UIManager.prototype.loadAllData = async function () {
    try {
        console.log("Загрузка всех данных приложения...");

        // проверка аутентификации
        if (!api.token) {
            console.error("Нет токена для загрузки данных");
            this.showMessage("Ошибка авторизации", "error");
            return;
        }

        // загрузка справочных данных
        await this.loadReferenceData();

        // инициализация поиска - только если не была инициализирована ранее
        if (typeof this.initSearchAndFilters === "function") {
            const searchExists = document.querySelector(".search-filters-container");
            if (!searchExists) {
                console.log("Создаем интерфейс поиска...");
                this.initSearchAndFilters();
                // После инициализации search сам загрузит моды через performSearch()
            } else {
                console.log("Интерфейс поиска уже существует, загружаем моды с текущими фильтрами");
                // Перезагружаем моды с текущими параметрами поиска
                await this.performSearch();
            }
        }

        // Только загрузка коллекций (моды уже загружены через performSearch)
        const collectionsResponse = await api.getCollections(this.currentCollectionPage, this.pageSize).catch(e => {
            console.error("Ошибка загрузки коллекций:", e);
            return { items: [], totalCount: 0 };
        });

        // сохранение данных коллекций
        this.collections = collectionsResponse.items || collectionsResponse || [];
        this.totalCollections = collectionsResponse.totalCount || 0;

        // обновление интерфейса (моды уже отрендерены в performSearch)
        this.renderCollections();
        this.updateStats();

        console.log("Все данные успешно загружены");

    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        this.showMessage("Ошибка загрузки данных", "error");
    }
};

/**
 * Загрузка справочных данных: версии, модлоадеры, теги, разработчики и т.д.
 */
UIManager.prototype.loadReferenceData = async function () {
    try {
        console.log("Загрузка справочных данных...");

        // параллельная загрузка всех справочников
        const [versions, modLoaders, tags, developers, difficulties, focuses] = await Promise.all([
            api.getVersions().catch(e => {
                console.error("Ошибка загрузки версий:", e);
                return { items: [] };
            }),
            api.getModLoaders().catch(e => {
                console.error("Ошибка загрузки модлоадеров:", e);
                return { items: [] };
            }),
            api.getTags().catch(e => {
                console.error("Ошибка загрузки тегов:", e);
                return { items: [] };
            }),
            api.getDevelopers().catch(e => {
                console.error("Ошибка загрузки разработчиков:", e);
                return { items: [] };
            }),
            api.getDifficulties().catch(e => {
                console.error("Ошибка загрузки сложностей:", e);
                return { items: [] };
            }),
            api.getFocuses().catch(e => {
                console.error("Ошибка загрузки фокусов:", e);
                return { items: [] };
            })
        ]);

        // сохранение справочных данных
        this.availableVersions = versions.items || versions || [];
        this.availableModLoaders = modLoaders.items || modLoaders || [];
        this.availableTags = tags.items || tags || [];
        this.availableDevelopers = developers.items || developers || [];
        this.availableDifficulties = difficulties.items || difficulties || [];
        this.availableFocuses = focuses.items || focuses || [];

        console.log("Справочные данные загружены:", {
            versions: this.availableVersions.length,
            modLoaders: this.availableModLoaders.length,
            tags: this.availableTags.length,
            developers: this.availableDevelopers.length,
            difficulties: this.availableDifficulties.length,
            focuses: this.availableFocuses.length
        });

    }
    catch (error) {
        console.error("Ошибка загрузки справочных данных:", error);
        // установка пустых значений при ошибке
        this.availableVersions = [];
        this.availableModLoaders = [];
        this.availableTags = [];
        this.availableDevelopers = [];
        this.availableDifficulties = [];
        this.availableFocuses = [];
    }
};

// Блок: Быстрое добавление элементов
// ===================================

/**
 * Быстрое добавление элементов справочников
 * @param {string} type - тип элемента (version, modloader, tag и т.д.)
 */
UIManager.prototype.handleQuickAdd = async function (type) {
    console.log(`Быстрое добавление: ${type}`);

    const inputId = `quick-${type}`;
    const input = document.getElementById(inputId);

    if (!input) {
        console.error(`Поле ввода ${inputId} не найдено`);
        return;
    }

    const value = input.value.trim();
    if (!value) {
        this.showButtonFeedback(type, 'error', 'Введите значение');
        return;
    }

    try {
        // индикатор загрузки на кнопке
        const button = document.querySelector(`[data-type="${type}"]`);
        const originalText = button.textContent;
        button.textContent = "...";
        button.disabled = true;

        // подготовка данных в зависимости от типа
        let data = {};

        switch (type) {
            case "version":
            case "modloader":
            case "tag":
            case "difficulty":
                data = {
                    title: value,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                break;
            case "developer":
                data = {
                    nickname: value,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                break;
            case "focus":
                data = {
                    name: value,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                break;
            default:
                throw new Error(`Неизвестный тип: ${type}`);
        }

        // выбор API метода в зависимости от типа
        let result;
        switch (type) {
            case "version":
                result = await api.createVersion(data);
                break;
            case "modloader":
                result = await api.createModLoader(data);
                break;
            case "tag":
                result = await api.createTag(data);
                break;
            case "developer":
                result = await api.createDeveloper(data);
                break;
            case "difficulty":
                result = await api.createDifficulty(data);
                break;
            case "focus":
                result = await api.createFocus(data);
                break;
            default:
                throw new Error(`Неизвестный тип: ${type}`);
        }

        console.log(`${type} создан:`, result);
        input.value = "";

        // успех - зеленый цвет
        this.showButtonFeedback(type, 'success', `+ ${this.getTypeName(type)}`);

        // обновление справочных данных
        await this.loadReferenceData();

    }
    catch (error) {
        console.error(`Ошибка создания ${type}:`, error);

        // детализированная обработка ошибок
        let userMessage = `Ошибка создания ${this.getTypeName(type)}`;

        if (error.message.includes("Nickname cannot be empty")) {
            userMessage = "Имя разработчика не может быть пустым";
        }
        else if (error.message.includes("Name") && error.message.includes("required")) {
            userMessage = 'Поле "Название" обязательно для заполнения';
        }
        else if (error.message.includes("400")) {
            userMessage = "Проверьте правильность введенных данных";
        }
        else if (error.message.includes("Network") || error.message.includes("Failed to fetch")) {
            userMessage = "Проблемы с соединением. Проверьте интернет";
        }

        // ошибка - красный цвет
        this.showButtonFeedback(type, 'error', userMessage);
    }
};

/**
 * Визуальная индикация на кнопке
 * @param {string} type - тип элемента
 * @param {string} status - success | error
 * @param {string} message - сообщение для кнопки
 */
UIManager.prototype.showButtonFeedback = function (type, status, message) {
    const button = document.querySelector(`[data-type="${type}"]`);
    if (!button) return;

    // сохраняем оригинальные стили
    const originalBackground = button.style.backgroundColor;
    const originalColor = button.style.color;
    const originalBorder = button.style.borderColor;

    // устанавливаем новые стили в зависимости от статуса
    if (status === 'success') {
        button.style.backgroundColor = 'var(--success-color)';
        button.style.color = 'white';
        button.style.borderColor = 'var(--success-color)';
    } else if (status === 'error') {
        button.style.backgroundColor = 'var(--error-color)';
        button.style.color = 'white';
        button.style.borderColor = 'var(--error-color)';
    }

    // устанавливаем текст кнопки
    button.textContent = message;
    button.disabled = false;

    // восстановление стилей через 2 секунды
    setTimeout(() => {
        button.style.backgroundColor = originalBackground || '';
        button.style.color = originalColor || '';
        button.style.borderColor = originalBorder || '';
        button.textContent = `+ ${this.getTypeName(type)}`;
    }, 2000);
};

// Блок: Система пагинации
// ========================

/**
 * Рендер пагинации для таблицы модов
 */
UIManager.prototype.renderModPagination = function () {
    const tableContainer = document.querySelector(".table-container");
    if (!tableContainer) return;

    // удаление старой пагинации
    const oldPagination = tableContainer.querySelector(".pagination");
    if (oldPagination) oldPagination.remove();

    // пагинация не нужна если все помещается на одной странице
    if (this.totalMods <= this.pageSize) return;

    const totalPages = Math.ceil(this.totalMods / this.pageSize);

    // создание элементов пагинации
    const pagination = document.createElement("div");
    pagination.className = "pagination";
    pagination.innerHTML = `
        <div class="pagination-info">
            Показано ${this.mods.length} из ${this.totalMods} модов
        </div>
        <div class="pagination-controls">
            <button class="btn btn-sm ${this.currentModPage <= 1 ? "btn-disabled" : "btn-primary"}" 
                    ${this.currentModPage <= 1 ? "disabled" : ""}
                    onclick="uiManager.prevModPage()">
                ← Назад
            </button>
            <span class="pagination-page">Страница ${this.currentModPage} из ${totalPages}</span>
            <button class="btn btn-sm ${this.currentModPage >= totalPages ? "btn-disabled" : "btn-primary"}" 
                    ${this.currentModPage >= totalPages ? "disabled" : ""}
                    onclick="uiManager.nextModPage()">
                Вперед →
            </button>
        </div>
    `;

    tableContainer.appendChild(pagination);
};

/**
 * Переход на следующую страницу модов
 */
UIManager.prototype.nextModPage = async function () {
    const totalPages = Math.ceil(this.totalMods / this.pageSize);
    if (this.currentModPage < totalPages) {
        this.currentModPage++;
        await this.loadModsPage();
    }
};

/**
 * Переход на предыдущую страницу модов
 */
UIManager.prototype.prevModPage = async function () {
    if (this.currentModPage > 1) {
        this.currentModPage--;
        await this.loadModsPage();
    }
};

/**
 * Загрузка конкретной страницы модов
 */
UIManager.prototype.loadModsPage = async function () {
    try {
        const response = await api.getMods(this.currentModPage, this.pageSize);
        this.mods = response.items || response || [];
        this.totalMods = response.totalCount || 0;
        this.renderMods();
    }
    catch (error) {
        console.error("Ошибка загрузки страницы модов:", error);
        this.showMessage("Ошибка загрузки страницы", "error");
    }
};