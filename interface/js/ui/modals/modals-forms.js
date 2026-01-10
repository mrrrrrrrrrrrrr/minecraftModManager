/**
 * СИСТЕМА ФОРМ И ПОЛЕЙ ВВОДА
 * Рендеринг полей форм, валидация, получение данных
 */

/**
 * Рендер поля формы с поддержкой всех типов
 */
UIManager.prototype.renderFormField = function (field) {
    // НОВЫЙ ТИП ПОЛЯ - грид-сетка для множественного выбора
    if (field.type === "multi-select-grid") {
        return this.renderMultiSelectGrid(field);
    }

    // Старые типы полей остаются без изменений
    switch (field.type) {
        case "textarea":
            return `
                <div class="form-group">
                    <label for="${field.id}">${field.label}</label>
                    <textarea id="${field.id}" placeholder="${field.placeholder}" 
                              ${field.required ? "required" : ""} rows="${field.rows || 3}">${field.value || ""}</textarea>
                </div>
            `;
        case "checkbox":
            return `
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="${field.id}" ${field.checked ? "checked" : ""}>
                    <label for="${field.id}">${field.label}</label>
                </div>
            `;
        case "multi-select":
            // Старый стиль multi-select (оставлен для обратной совместимости)
            const selectedIds = field.selected ? field.selected.map(item => item.id) : [];
            return `
                <div class="form-group">
                    <label for="${field.id}">${field.label}</label>
                    <div class="multi-select-container">
                        ${field.options.map(option => `
                            <label class="multi-select-item">
                                <input type="checkbox" name="${field.id}" value="${option.id}" 
                                       ${selectedIds.includes(option.id) ? "checked" : ""}>
                                <span class="multi-select-label">${this.escapeHtml(option[field.optionField] || option.title || option.name || option.nickname)}</span>
                            </label>
                        `).join("")}
                    </div>
                    ${field.required ? `<div class="field-error" id="${field.id}-error" style="display: none;">Выберите хотя бы один вариант</div>` : ""}
                </div>
            `;
        case "file":
            return `
                <div class="form-group">
                    <label for="${field.id}">${field.label}</label>
                    <div class="file-upload-container">
                        <input type="file" id="${field.id}" 
                               ${field.accept ? `accept="${field.accept}"` : ""}
                               class="file-input">
                        <label for="${field.id}" class="file-upload-label">
                            <span class="file-upload-text">📁 Выберите файл</span>
                            <span class="file-upload-hint">PNG, JPG, GIF до 5MB</span>
                        </label>
                        <div class="file-preview" id="${field.id}-preview" style="display: none;">
                            <img src="" alt="Preview" class="file-preview-image">
                            <button type="button" class="btn-remove-file" onclick="uiManager.removeFilePreview('${field.id}')">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        case "download-sources":
            return `
                <div class="form-group">
                    <label for="${field.id}">${field.label}</label>
                    <div class="form-hint" style="color: var(--info-color); font-size: 0.8rem; margin-bottom: 1%;">
                        💡 Можно загрузить файл (JAR, ZIP, RAR, 7Z) <strong>ИЛИ</strong> указать внешнюю ссылку
                    </div>
                    <div class="download-sources-container">
                        <div class="download-sources-list" id="${field.id}-list">
                            <!-- Динамически добавляемые источники -->
                        </div>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="uiManager.addDownloadSource('${field.id}')">
                            + Добавить источник
                        </button>
                    </div>
                </div>
            `;
       case "gallery":
    return `
        <div class="form-group">
            <label for="${field.id}">${field.label}</label>
            <div class="form-hint" style="color: var(--info-color); font-size: 0.8rem; margin-bottom: 10px;">
                💡 Можно загрузить несколько изображений для галереи мода
            </div>
            <div class="gallery-container">
                <div class="gallery-preview" id="${field.id}-preview">
                    ${field.existingImages && field.existingImages.length > 0 ? 
                        field.existingImages.map(img => `
                            <div class="gallery-item" data-image-id="${img.id}">
                                <img src="${img.imageUrl}" alt="${img.fileName}" 
                                     onclick="uiManager.showGalleryImage('${img.imageUrl}', '${img.fileName.replace(/'/g, "\\'")}')">
                                <button type="button" class="btn-remove-gallery" 
                                        onclick="uiManager.removeExistingGalleryImage('${field.id}', '${img.id}')">
                                    🗑️
                                </button>
                                <div class="gallery-item-name">${img.fileName}</div>
                            </div>
                        `).join('') : 
                        '<div class="gallery-empty">Нет изображений</div>'
                    }
                </div>
                <div class="gallery-actions">
                    <input type="file" id="${field.id}" multiple 
                           accept="image/jpeg,image/png,image/gif,image/webp" 
                           class="gallery-input" style="display: none;">
                    <button type="button" class="btn btn-sm btn-secondary" 
                            onclick="document.getElementById('${field.id}').click()">
                        📷 Добавить изображения
                    </button>
                    <span class="gallery-hint">(JPG, PNG, GIF, WebP до 5MB)</span>
                </div>
            </div>
        </div>
    `;
        case "mods-selector":
            return this.renderModsSelectorField(field);


        case "single-select-grid":
            return this.renderSingleSelectGrid(field);
            
        default:
            return `
                <div class="form-group">
                    <label for="${field.id}">${field.label}</label>
                    <input type="${field.type}" id="${field.id}" 
                           placeholder="${field.placeholder}" 
                           ${field.value ? `value="${field.value}"` : ""}
                           ${field.step ? `step="${field.step}"` : ""}
                           ${field.required ? "required" : ""}>
                </div>
            `;
    }
};

/**
 * Получение данных формы с поддержкой всех типов полей
 */
UIManager.prototype.getFormData = async function (fields) {
    document.querySelectorAll(".field-error").forEach(error => {
        error.style.display = "none";
    });

    const data = {};

    const processField = async (field) => {
        // обработка нового типа поля
        if (field.type === "multi-select-grid") {
            const selectedOptions = Array.from(document.querySelectorAll(`input[name="${field.id}"]:checked`))
                .map(checkbox => checkbox.value);
            data[field.id] = selectedOptions;

            if (field.required && selectedOptions.length === 0) {
                const errorElement = document.getElementById(`${field.id}-error`);
                if (errorElement) {
                    errorElement.style.display = "block";
                }
                throw new Error(`Поле "${field.label}" обязательно для заполнения`);
            }
        }
        // Старая обработка multi-select (для обратной совместимости)
        else if (field.type === "multi-select") {
            const selectedOptions = Array.from(document.querySelectorAll(`input[name="${field.id}"]:checked`))
                .map(checkbox => checkbox.value);
            data[field.id] = selectedOptions;

            if (field.required && selectedOptions.length === 0) {
                const errorElement = document.getElementById(`${field.id}-error`);
                if (errorElement) {
                    errorElement.style.display = "block";
                }
                throw new Error(`Поле "${field.label}" обязательно для заполнения`);
            }
        }
        else if (field.type === "file") {
            const fileInput = document.getElementById(field.id);
            const previewContainer = document.getElementById(`${field.id}-preview`);

            // 🔥 ОБРАБОТКА УДАЛЕНИЯ ИЗОБРАЖЕНИЯ
            if (previewContainer && previewContainer.style.display === "none") {
                // Пользователь удалил превью - помечаем для удаления
                data[field.id] = null; // 🔥 СПЕЦИАЛЬНОЕ ЗНАЧЕНИЕ ДЛЯ УДАЛЕНИЯ
                console.log("🗑️ Изображение помечено для удаления");
            }
            else if (fileInput && fileInput.files.length > 0) {
                // Новый файл выбран
                const file = fileInput.files[0];
                if (file) {
                    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
                    if (!allowedImageTypes.includes(file.type)) {
                        throw new Error("❌ Для аватарки выберите файл формата JPG, PNG, GIF или WebP");
                    }
                    data[field.id] = file;
                }
            }
            else {
                // Файл не изменялся - передаем специальное значение
                data[field.id] = "keep_current"; // 🔥 СОХРАНИТЬ ТЕКУЩЕЕ
            }
        }
        else if (field.type === "gallery") {
            const fileInput = document.getElementById(field.id);
            const galleryFiles = [];

            if (fileInput && fileInput.files.length > 0) {
                for (let i = 0; i < fileInput.files.length; i++) {
                    const file = fileInput.files[i];

                    // Проверяем что это изображение
                    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
                    if (!allowedImageTypes.includes(file.type)) {
                        throw new Error("❌ Для галереи выберите файлы формата JPG, PNG, GIF или WebP");
                    }

                    // Проверяем размер
                    if (file.size > 5 * 1024 * 1024) {
                        throw new Error(`❌ Файл "${file.name}" слишком большой (макс. 5MB)`);
                    }

                    galleryFiles.push(file);
                }
            }

            data[field.id] = galleryFiles;
            console.log(`📷 Загружено файлов для галереи: ${galleryFiles.length}`);
        }
        else if (field.type === "download-sources") {
            const sources = [];
            const sourceItems = document.querySelectorAll(`#${field.id}-list .download-source-item`);
            console.log("🔍 СБОР ДАННЫХ ИСТОЧНИКОВ:", {
                fieldId: field.id,
                itemsCount: sourceItems.length
            });

            for (const item of sourceItems) {
                const sourceId = item.getAttribute("data-id");
                const versionCheckboxes = item.querySelectorAll(".source-version-cb:checked");
                const loaderCheckboxes = item.querySelectorAll(".source-modloader-cb:checked");
                const versionIds = Array.from(versionCheckboxes).map(cb => cb.value);
                const loaderIds = Array.from(loaderCheckboxes).map(cb => cb.value);

                // Получаем состояние источника
                const state = this.downloadSourceStates[sourceId];

                if (!state) {
                    console.error("❌ СОСТОЯНИЕ ИСТОЧНИКА НЕ НАЙДЕНО:", sourceId);
                    continue;
                }

                // Валидация
                if (versionIds.length === 0 || loaderIds.length === 0) {
                    throw new Error("❌ Для каждого источника выберите версии и модлоадеры");
                }

                if (!state.url && !state.file && !state.filePath) {
                    throw new Error("❌ Для каждого источника укажите ссылку ИЛИ выберите файл");
                }

                // 🔥 ВСЕГДА ДОБАВЛЯЕМ ВСЕ ИСТОЧНИКИ ИЗ ФОРМЫ
                // (в updateMod будем решать - создавать новый или обновлять существующий)
                let sourceData = {
                    id: sourceId, // 🔥 ВСЕГДА ПЕРЕДАЕМ ID, ДАЖЕ ДЛЯ СУЩЕСТВУЮЩИХ
                    versionIds: versionIds,
                    modLoaderIds: loaderIds
                };

                if (state.url) {
                    sourceData.url = state.url;
                }

                if (state.file) {
                    sourceData.file = state.file;
                }
                else if (state.filePath) {
                    sourceData.filePath = state.filePath;
                    sourceData.fileName = state.fileName;
                    sourceData.fileSize = state.fileSize;
                }

                // Формируем заголовок
                const versionTitles = versionIds.map(id => (this.availableVersions.find(v => v.id === id) || {}).title || id);
                const loaderTitles = loaderIds.map(id => (this.availableModLoaders.find(ml => ml.id === id) || {}).title || id);
                sourceData.title = `${versionTitles.join(", ")} | ${loaderTitles.join(", ")}`;

                sources.push(sourceData);
                console.log("💾 ДАННЫЕ ИСТОЧНИКА ДЛЯ ОБРАБОТКИ:", sourceData);
            }

            data["download-sources"] = sources;
            console.log("📦 ВСЕ ИСТОЧНИКИ ДЛЯ ОБРАБОТКИ:", sources);
        }
        else if (field.type === "single-select-grid") 
        {
            const selectedOption = document.querySelector(`input[name="${field.id}"]:checked`);
            data[field.id] = selectedOption ? [selectedOption.value] : [];

            if (field.required && !selectedOption) 
            {
                const errorElement = document.getElementById(`${field.id}-error`);
                if (errorElement) 
                {
                    errorElement.style.display = "block";
                }
                throw new Error(`${field.label}`);
            }
        }
        else if (field.type === "mods-selector") 
        {
            // используем сохраненное хранилище выбранных модов
            const selectedModIds = Object.keys(this.currentModsSelection || {});
            data[field.id] = selectedModIds;

            if (field.required && selectedModIds.length === 0) 
            {
                const errorElement = document.getElementById(`${field.id}-error`);
                if (errorElement) 
                {
                    errorElement.style.display = "block";
                }
                throw new Error(`${field.label}`);
            }
        }


        else {
            const element = document.getElementById(field.id);
            if (!element) {
                console.error(`❌ Элемент с ID "${field.id}" не найден`);
                return;
            }

            if (field.type === "checkbox") {
                data[field.id] = element.checked;
            }
            else if (field.type === "number") {
                data[field.id] = parseFloat(element.value) || 0;
            }
            else {
                data[field.id] = element.value;
            }
        }
    };

    try {
        // Обрабатываем все поля последовательно
        for (const field of fields) {
            await processField(field);
        }
        return data;
    }
    catch (error) {
        console.error("❌ Ошибка валидации формы:", error);
        throw error;
    }
};

/**
 * Методы для работы с файлами
 */

/**
 * Показ текущего изображения
 */
UIManager.prototype.showCurrentImage = function (inputId, imageUrl) {
    const previewContainer = document.getElementById(`${inputId}-preview`);
    const previewImage = previewContainer.querySelector(".file-preview-image");
    const fileInput = document.getElementById(inputId);

    if (previewContainer && previewImage) {
        previewImage.src = imageUrl;
        previewContainer.style.display = "flex";
        if (fileInput) {
            fileInput.style.display = "none";
        }
    }
};

/**
 * Удаление превью файла
 */
UIManager.prototype.removeFilePreview = function (inputId) {
    const previewContainer = document.getElementById(`${inputId}-preview`);
    const fileInput = document.getElementById(inputId);

    if (previewContainer) {
        previewContainer.style.display = "none";
        // 🔥 ДОБАВЛЯЕМ СПЕЦИАЛЬНЫЙ DATA-АТРИБУТ ДЛЯ ОБОЗНАЧЕНИЯ УДАЛЕНИЯ
        previewContainer.setAttribute('data-removed', 'true');
    }
    
    if (fileInput) {
        fileInput.value = "";
        fileInput.style.display = "block";
    }
    
    console.log("🗑️ Превью файла удалено, изображение помечено для удаления");
};