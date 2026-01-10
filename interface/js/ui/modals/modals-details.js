/**
 * ДЕТАЛИ МОДОВ И ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
 * Показ детальной информации, редактирование, вспомогательные функции
 */

/**
 * Редактирование мода
 */
UIManager.prototype.editMod = async function (modId) {
    console.log("Редактирование мода:", modId);

    const mod = this.mods.find(m => m.id === modId);
    if (!mod) {
        this.showMessage("❌ Мод не найден", "error");
        return;
    }

    // подгружаем актуальные источники скачивания для конкретного мода
    let existingSources = [];
    try {
        console.log("Загрузка источников для конкретного мода:", modId);
        existingSources = await api.getDownloadSourcesByModId(modId);
        console.log("Загружены источники для мода:", existingSources);
    }
    catch (error) {
        console.log("Источники не загружены:", error.message);
    }

    // 🔥 ЗАГРУЖАЕМ ГАЛЕРЕЮ МОДА
    let modGallery = [];
    try {
        modGallery = await api.getModGallery(modId);
        console.log("📷 Загружена галерея мода:", modGallery);
    } catch (error) {
        console.log("⚠️ Не удалось загрузить галерею мода:", error);
    }

    this.createModal({
        title: "✏️ Редактировать мод",
        fields: [
            {
                type: "text",
                id: "edit-mod-title",
                label: "Название мода",
                required: true,
                placeholder: "Введите название мода",
                value: mod.title
            },
            {
                type: "textarea",
                id: "edit-mod-description",
                label: "Описание",
                required: false,
                placeholder: "Описание мода",
                rows: 3,
                value: mod.description || ""
            },
            {
                type: "number",
                id: "edit-mod-size",
                label: "Размер (MB)",
                required: true,
                placeholder: "0.0",
                step: "0.1",
                value: mod.size
            },
            {
                type: "number",
                id: "edit-mod-downloads",
                label: "Количество загрузок",
                required: true,
                placeholder: "0",
                value: mod.downloads
            },
            { type: "checkbox", id: "edit-mod-clientside", label: "🎮 Клиентский мод", checked: mod.isClientside },

            // поля множественного выбора
            {
                type: "multi-select-grid",
                id: "edit-mod-versions",
                label: "Версии",
                required: true,
                options: this.availableVersions,
                optionField: "title",
                optionType: "version",
                selected: mod.versions
            },
            {
                type: "multi-select-grid",
                id: "edit-mod-loaders",
                label: "Модлоадеры *",
                required: true,
                options: this.availableModLoaders,
                optionField: "title",
                optionType: "loader",
                selected: mod.modLoaders
            },
            {
                type: "multi-select-grid",
                id: "edit-mod-tags",
                label: "Теги",
                required: false,
                options: this.availableTags,
                optionField: "title",
                optionType: "tag",
                selected: mod.tags
            },
            {
                type: "multi-select-grid",
                id: "edit-mod-developers",
                label: "Разработчики",
                required: false,
                options: this.availableDevelopers,
                optionField: "nickname",
                optionType: "developer",
                selected: mod.developers
            },

            { type: "file", id: "edit-mod-image", label: "Аватарка мода", accept: "image/*" },

            {
                type: "gallery",
                id: "edit-mod-gallery",
                label: "Скриншоты мода",
                existingImages: modGallery // 🔥 ПЕРЕДАЕМ СУЩЕСТВУЮЩИЕ ИЗОБРАЖЕНИЯ
            },

            {
                type: "download-sources",
                id: "mod-download-sources",
                label: "Источники скачивания",
                versions: this.availableVersions,
                modLoaders: this.availableModLoaders
            }
        ],
        onSubmit: (data) => this.updateMod(modId, data),
        onOpen: () => {
            // предзаполнение источников
            console.log("onOpen вызван, предзаполняем источники:", existingSources);
            if (existingSources && existingSources.length > 0) {
                console.log("Предзаполняем источники после открытия модала. Количество:", existingSources.length);
                this.prefillDownloadSources("mod-download-sources", existingSources);
            }
            else {
                console.log("Нет существующих источников для предзаполнения");
            }

            // Предзаполняем остальные поля
            this.prefillMultiSelectGrid("edit-mod-versions", mod.versions);
            this.prefillMultiSelectGrid("edit-mod-loaders", mod.modLoaders);
            this.prefillMultiSelectGrid("edit-mod-tags", mod.tags);
            this.prefillMultiSelectGrid("edit-mod-developers", mod.developers);

            if (mod.imageUrl) {
                this.showCurrentImage("edit-mod-image", mod.imageUrl);
            }

            // 🔥 ИНИЦИАЛИЗИРУЕМ ГАЛЕРЕЮ С СУЩЕСТВУЮЩИМИ ИЗОБРАЖЕНИЯМИ
            this.initEditGallery("edit-mod-gallery", modGallery);
        }
    });
};

/**
 * Показ деталей мода
 */
/**
 * Показ деталей мода
 */
UIManager.prototype.showModDetails = async function (mod) {
    try {
        // Загружаем галерею мода
        let galleryImages = [];
        try {
            galleryImages = await api.getModGallery(mod.id);
            console.log("📷 Загружена галерея мода:", galleryImages.length, "изображений");
        } catch (error) {
            console.log("⚠️ Не удалось загрузить галерею мода:", error);
        }

        const mainDeveloper = mod.developers && mod.developers.length > 0 ? mod.developers[0] : null;
        const versions = mod.versions || [];
        const tags = mod.tags || [];
        const modLoaders = mod.modLoaders || [];
        const allDevelopers = mod.developers || [];

        // Создаем секции динамически
        const sections = [];

        // Секция версий
        if (versions.length > 0) {
            sections.push(`
                <div class="mod-details-section">
                    <p class="mod-details-section-title">Совместимые версии</p>
                    <div class="mod-details-versions-container">
                        ${versions.map(version =>
                `<span class="mod-details-version">${this.escapeHtml(version.title)}</span>`
            ).join("")}
                    </div>
                </div>
            `);
        }

        // Секция модлоадеров
        if (modLoaders.length > 0) {
            sections.push(`
                <div class="mod-details-section">
                    <p class="mod-details-section-title">Модлоадеры</p>
                    <div class="mod-details-loaders-container">
                        ${modLoaders.map(loader =>
                `<span class="mod-details-loader">${this.escapeHtml(loader.title)}</span>`
            ).join("")}
                    </div>
                </div>
            `);
        }

        // Секция тегов
        if (tags.length > 0) {
            sections.push(`
                <div class="mod-details-section">
                    <p class="mod-details-section-title">Теги</p>
                    <div class="mod-details-tags-container">
                        ${tags.map(tag =>
                `<span class="mod-details-tag">${this.escapeHtml(tag.title)}</span>`
            ).join("")}
                    </div>
                </div>
            `);
        }

        // Секция разработчиков (если больше одного)
        if (allDevelopers.length > 1) {
            sections.push(`
                <div class="mod-details-section">
                    <p class="mod-details-section-title">Разработчики</p>
                    <div class="mod-details-tags-container">
                        ${allDevelopers.map(dev =>
                `<span class="mod-details-tag">${this.escapeHtml(dev.nickname)}</span>`
            ).join("")}
                    </div>
                </div>
            `);
        }

        // Секция галереи (если есть изображения)
        let gallerySection = '';
        if (galleryImages.length > 0) {
            gallerySection = `
                <div class="mod-details-section">
                    <p class="mod-details-section-title">📷 Галерея мода</p>
                    <div class="mod-gallery-carousel" id="mod-gallery-${mod.id}">
                        <div class="carousel-container">
                            <button class="carousel-btn carousel-prev" onclick="uiManager.carouselPrev('${mod.id}')">❮</button>
                            
                            <div class="carousel-track">
                                <div class="carousel-slide carousel-prev-slide">
                                    <img src="" alt="Previous image" class="carousel-image">
                                </div>
                                <div class="carousel-slide carousel-active-slide">
                                    <img src="" alt="Active image" class="carousel-image">
                                </div>
                                <div class="carousel-slide carousel-next-slide">
                                    <img src="" alt="Next image" class="carousel-image">
                                </div>
                            </div>
                            
                            <button class="carousel-btn carousel-next" onclick="uiManager.carouselNext('${mod.id}')">❯</button>
                            
                            <div class="carousel-dots" id="carousel-dots-${mod.id}">
                                <!-- Точки будут добавляться динамически -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        this.createModal({
            title: "Детали мода",
            customContent: `
                <div class="mod-details-content">
                    <div class="mod-details-header">
                        <div class="mod-details-image">
                            ${mod.imageUrl ? `
                            <img src="${mod.imageUrl}" alt="${this.escapeHtml(mod.title)}" />
                            ` : "📦"}
                        </div>
                        
                        <div>
                            <p class="mod-details-title">${this.escapeHtml(mod.title || "Без названия")}</p>
                        
                            ${mainDeveloper ? `
                            <div class="mod-details-developer">от ${this.escapeHtml(mainDeveloper.nickname)}</div>
                            ` : ""}
                        
                            ${mod.description ? `
                            <div class="mod-details-description">
                                ${this.escapeHtml(mod.description)}
                            </div>
                            ` : "<div class=\"mod-details-description\" style=\"color: #888; font-style: italic; background: rgba(255,255,255,0.02);\">Описание отсутствует</div>"}
                        </div>
                    </div>

                    <div class="mod-details-info">
                        
                        <div class="mod-details-grid">
                            <div class="mod-details-stat">
                                <div class="mod-details-stat-value">${this.formatNumber(mod.downloads || 0)}</div>
                                <div class="mod-details-stat-label">Скачивания</div>
                            </div>
                            <div class="mod-details-stat">
                                <div class="mod-details-stat-value">${mod.size || 0} MB</div>
                                <div class="mod-details-stat-label">Размер</div>
                            </div>
                            <div class="mod-details-stat">
                                <div class="mod-details-stat-value">${mod.isClientside ? "🎮" : "🖥️"}</div>
                                <div class="mod-details-stat-label">Тип</div>
                            </div>
                            <div class="mod-details-stat">
                                <div class="mod-details-stat-value">${new Date(mod.updatedAt).toLocaleDateString("ru-RU")}</div>
                                <div class="mod-details-stat-label">Обновлено</div>
                            </div>
                        </div>
                        
                        ${sections.length > 0 || galleryImages.length > 0 ? `
                            <div class="mod-details-sections">
                                ${sections.join("")}
                                ${gallerySection}
                            </div>
                        ` : ""}
                        
                        <div class="mod-details-actions">
                            <button class="btn btn-secondary" onclick="uiManager.closeModal()">Закрыть</button>
                            <button class="btn btn-warning" onclick="uiManager.editMod('${mod.id}')">
                                ✏️ Редактировать
                            </button>
                            <button class="btn btn-danger" onclick="uiManager.deleteMod('${mod.id}')">
                                🗑️ Удалить мод
                            </button>
                            <button class="btn btn-download" onclick="uiManager.openDownloadModal('${mod.id}')">
                                ⬇️ Скачать мод
                            </button>
                        </div>
                    </div>
                </div>
            `,
            customClass: "modal-mod-details",
            showDefaultActions: false,
            onOpen: () => {
                // Инициализируем карусель после открытия модального окна
                if (galleryImages.length > 0) {
                    setTimeout(() => {
                        this.initModCarousel(mod.id, galleryImages);
                    }, 100);
                }
            },
            onClose: () => {
                // Очищаем карусель при закрытии
                if (galleryImages.length > 0) {
                    this.cleanupCarousel(mod.id);
                }
            }
        });

    } catch (error) {
        console.error("❌ Ошибка показа деталей мода:", error);
        this.showMessage("❌ Ошибка загрузки деталей мода", "error");
    }
};
/**
 * Показ полного описания
 */
UIManager.prototype.showFullDescription = function (element) {
    const row = element.closest("tr");
    const descriptionCell = row.querySelector(".mod-description-cell");
    const fullDescription = descriptionCell.getAttribute("title");

    this.createModal({
        title: "Полное описание мода",
        customContent: `
            <div class="full-description-modal">
                <div class="description-content">
                    ${this.escapeHtml(fullDescription)}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="uiManager.closeModal()">Закрыть</button>
                </div>
            </div>
        `,
        customClass: "modal-description"
    });
};

/**
 * Загрузка изображения на сервер
 */
UIManager.prototype.uploadImageToServer = async function (file) {
    const formData = new FormData();
    formData.append("file", file);

    const uploadUrl = `${api.baseURL}/Upload/image`;
    console.log("Отправка файла на:", uploadUrl);

    const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${api.token}`
        },
        body: formData
    });

    console.log("Статус ответа:", response.status, response.statusText);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Текст ошибки:", errorText);
        throw new Error(`Ошибка загрузки изображения: ${response.status} ${response.statusText}`);
    }

    const relativeUrl = await response.text();
    // ВОЗВРАЩАЕМ ПОЛНЫЙ URL
    const fullImageUrl = `${api.baseURL}${relativeUrl}`;
    console.log("Полный URL изображения:", fullImageUrl);
    return fullImageUrl;
};

/**
 * удаление мода
 * @param {string} modId - ID мода для удаления
 */
UIManager.prototype.deleteMod = async function (modId) {
    try {
        console.log("🗑️ Начало удаления мода:", modId);

        // проверка аутентификации
        if (!api.token) {
            this.showMessage("❌ Ошибка авторизации. Попробуйте войти снова.", "error");
            return;
        }

        // поиск мода 
        const mod = this.mods.find(m => m.id === modId);
        if (!mod) {
            this.showMessage("❌ Мод не найден", "error");
            return;
        }

        // интерфейс подтверждения удаления
        this.createModal({
            title: "🗑️ Удаление мода",
            customContent: `
                <div class="delete-confirmation-modal">
                    <div class="warning-icon">
                        <p>⚠️ Вы уверены, что хотите удалить мод?</p>
                    </div>
                    <div class="mod-info-card">
                        <div class="mod-info-header">
                            ${mod.imageUrl ? `
                            <img src="${mod.imageUrl}" alt="${this.escapeHtml(mod.title)}" class="mod-info-image" />
                            ` : "<div class=\"mod-info-placeholder\">📦</div>"}
                            <div class="mod-info-text">
                                <div class="mod-info-title">${this.escapeHtml(mod.title)}</div>
                                ${mod.developers && mod.developers.length > 0 ? `
                                <div class="mod-info-developer">от ${this.escapeHtml(mod.developers[0].nickname)}</div>
                                ` : ""}
                            </div>
                        </div>
                        <div class="mod-info-stats">
                            <div class="mod-info-stat">
                                <span class="stat-label">Скачивания:</span>
                                <span class="stat-value">${this.formatNumber(mod.downloads || 0)}</span>
                            </div>
                            <div class="mod-info-stat">
                                <span class="stat-label">Размер:</span>
                                <span class="stat-value">${mod.size || 0} MB</span>
                            </div>
                            <div class="mod-info-stat">
                                <span class="stat-label">Версий:</span>
                                <span class="stat-value">${mod.versions ? mod.versions.length : 0}</span>
                            </div>
                        </div>
                    </div>
                    <div class="warning-message">
                        <strong>Это действие нельзя отменить!</strong><br>
                        Все данные мода, включая источники скачивания, будут безвозвратно удалены.
                    </div>
                    
                    <!-- ДОБАВЛЯЕМ КНОПКИ ДЕЙСТВИЙ -->
                    <div class="delete-confirmation-actions">
                        <button class="btn btn-secondary" onclick="uiManager.closeModal()">
                            ❌ Отмена
                        </button>
                        <button class="btn btn-danger" onclick="uiManager.confirmDeleteMod('${modId}')">
                            🗑️ Удалить навсегда
                        </button>
                    </div>
                </div>
            `,
            customClass: "modal-delete-confirmation",
            showDefaultActions: false // Отключаем стандартные кнопки модала
        });

    }
    catch (error) {
        console.error("❌ Ошибка при подготовке удаления:", error);
        this.showMessage("❌ Ошибка при подготовке удаления", "error");
    }
};

/**
 * то, что после подтверждения удаления
 * @param {string} modId - ID мода для удаления
 */
UIManager.prototype.confirmDeleteMod = async function (modId) {
    try {
        console.log("🚀 Подтвержденное удаление мода:", modId);

        const mod = this.mods.find(m => m.id === modId);
        if (!mod) {
            this.showMessage("❌ Мод не найден", "error");
            return;
        }

        // удаление источников скачивания
        try {
            const existingSources = await api.getDownloadSourcesByModId(modId);
            console.log(`📋 Удаляем ${existingSources.length} источников...`);

            for (const source of existingSources) {
                await api.deleteDownloadSource(source.id);
            }
            console.log("✅ Все источники удалены");
        }
        catch (error) {
            console.log("Источники не удалены (возможно их нет):", error.message);
        }

        // удаление мода
        await api.deleteMod(modId);

        // успешное удаление
        this.closeModal();

        // обновление интерфейса
        await this.loadAllData();

    }
    catch (error) {
        console.error("❌ Ошибка удаления мода:", error);

        let userMessage = "❌ Ошибка при удалении мода";

        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
            userMessage = "❌ Ошибка авторизации";
            authManager.logout();
        }
        else if (error.message.includes("404")) {
            userMessage = "❌ Мод не найден на сервере";
        }
        else if (error.message.includes("403")) {
            userMessage = "❌ Недостаточно прав для удаления";
        }
        else if (error.message.includes("Network")) {
            userMessage = "❌ Проблемы с соединением";
        }
        else {
            userMessage = `❌ ${error.message}`;
        }

        this.showMessage(userMessage, "error");
    }
};