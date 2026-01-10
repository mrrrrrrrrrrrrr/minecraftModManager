/**
 * ОСНОВНЫЕ МЕТОДЫ МОДАЛЬНЫХ ОКОН
 * Базовые функции создания, открытия, закрытия модалок
 */

/**
 * Показ модального окна добавления мода
 */
UIManager.prototype.showAddModModal = function () 
{
    console.log("🎯 Открытие модального окна добавления мода");

    // Проверка доступности данных
    if (this.availableVersions.length === 0) {
        this.showMessage("❌ Нет доступных версий. Сначала создайте версию через \"Быстрое добавление\".", "error");
        return;
    }

    if (this.availableModLoaders.length === 0) {
        this.showMessage("❌ Нет доступных модлоадеров. Сначала создайте модлоадер через \"Быстрое добавление\".", "error");
        return;
    }

    // Создание модального окна с унифицированными полями выбора
    this.createModal({
        title: "Добавить новый мод",
        fields: [
            {
                type: "text",
                id: "mod-title",
                label: "Название мода",
                required: true,
                placeholder: "Введите название мода"
            },
            {
                type: "textarea",
                id: "mod-description",
                label: "Описание",
                required: false,
                placeholder: "Описание мода",
                rows: 3
            },
            { type: "number", id: "mod-size", label: "Размер (MB)", required: true, placeholder: "0.0", step: "0.1" },
            {
                type: "number",
                id: "mod-downloads",
                label: "Количество загрузок",
                required: true,
                placeholder: "0",
                value: 0
            },
            { type: "checkbox", id: "mod-clientside", label: "🎮 Клиентский мод", checked: false },

            // УНИФИЦИРОВАННЫЕ ПОЛЯ МНОЖЕСТВЕННОГО ВЫБОРА
            {
                type: "multi-select-grid",
                id: "mod-versions",
                label: "Версии",
                required: true,
                options: this.availableVersions,
                optionField: "title",
                optionType: "version"
            },
            {
                type: "multi-select-grid",
                id: "mod-loaders",
                label: "Модлоадеры",
                required: true,
                options: this.availableModLoaders,
                optionField: "title",
                optionType: "loader"
            },
            {
                type: "multi-select-grid",
                id: "mod-tags",
                label: "Теги",
                required: false,
                options: this.availableTags,
                optionField: "title",
                optionType: "tag"
            },
            {
                type: "multi-select-grid",
                id: "mod-developers",
                label: "Разработчики",
                required: false,
                options: this.availableDevelopers,
                optionField: "nickname",
                optionType: "developer"
            },

            { type: "file", id: "mod-image", label: "Аватарка мода", accept: "image/*" },

            {
                type: "gallery",
                id: "mod-gallery",
                label: "Скриншоты мода"
            },

            {
                type: "download-sources",
                id: "mod-download-sources",
                label: "Источники скачивания",
                versions: this.availableVersions,
                modLoaders: this.availableModLoaders
            }
        ],
        onSubmit: (data) => this.createMod(data)
    });
};

/**
 * Создание модального окна
 */
UIManager.prototype.createModal = function (config) {
    this.closeModal();

    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) {
        console.error("Контейнер для модальных окон не найден");
        this.showMessage("Ошибка: контейнер модальных окон не найден", "error");
        return;
    }

    const modal = document.createElement("div");
    modal.className = "modal-overlay";

    let modalBody = "";
    if (config.customContent) {
        modalBody = config.customContent;
    }
    else {
        modalBody = `
            <form class="modal-form" id="modal-form">
                ${config.fields.map(field => this.renderFormField(field)).join("")}
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="uiManager.closeModal()">Отмена</button>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </div>
            </form>
        `;
    }

    modal.innerHTML = `
        <div class="modal-content ${config.customClass || ""}">
            <div class="modal-header">
                <p>${config.title}</p>
                <button class="modal-close">&times;</button>
            </div>
            ${modalBody}
        </div>
    `;

    modalContainer.appendChild(modal);

    const closeBtn = modal.querySelector(".modal-close");
    const modalForm = modal.querySelector("#modal-form");

    // Закрытие по клику на крестик
    if (closeBtn) {
        closeBtn.addEventListener("click", () => this.closeModal());
    }

    // Закрытие по клику вне модального окна
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            this.closeModal();
        }
    });

    // Закрытие по Escape
    const handleEscape = (e) => {
        if (e.key === "Escape") {
            this.closeModal();
        }
    };
    document.addEventListener("keydown", handleEscape);

    // Сохраняем обработчик для удаления
    this.currentEscapeHandler = handleEscape;

    if (modalForm && !config.customContent) {
        modalForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            try {
                console.log("Начало обработки формы...");
                const formData = await this.getFormData(config.fields);
                console.log("Данные формы получены:", formData);
                config.onSubmit(formData);
            }
            catch (error) {
                console.log("Валидация формы:", error.message);
                this.showMessage(`${error.message}`, "error");
            }
        });
    }

    setTimeout(() => {
        modal.classList.add("active");

        // ВЫЗЫВАЕМ onOpen ПОСЛЕ ОТКРЫТИЯ МОДАЛА
        if (config.onOpen) {
            console.log("Вызов onOpen колбэка");
            config.onOpen();
        }

        // 🔥 ИНИЦИАЛИЗАЦИЯ ГАЛЕРЕИ ПОСЛЕ ОТКРЫТИЯ МОДАЛА
        if (config.fields && !config.customContent) {
            config.fields.forEach(field => {
                if (field.type === "gallery") {
                    console.log("🎨 Инициализация галереи для поля:", field.id);
                    this.initGallery(field.id);
                }
            });
        }
    }, 10);

    console.log("Модальное окно создано");
};

/**
 * Закрытие модального окна
 */
UIManager.prototype.closeModal = function () {
    const modal = document.querySelector(".modal-overlay");
    if (modal) {
        modal.classList.remove("active");
        setTimeout(() => {
            modal.remove();
            // ОЧИЩАЕМ ВРЕМЕННЫЕ ДАННЫЕ ИСТОЧНИКОВ
            this.cleanupDownloadSources();
            
            // 🔥 ОЧИЩАЕМ OBJECT URLs ГАЛЕРЕИ ПРИ ЗАКРЫТИИ МОДАЛА
            this.cleanupGalleryObjectUrls("mod-gallery");
            this.cleanupGalleryObjectUrls("edit-mod-gallery");
            
            // 🔥 ОСТАНАВЛИВАЕМ ВСЕ АКТИВНЫЕ КАРУСЕЛИ
            if (this.carousels) {
                Object.keys(this.carousels).forEach(modId => {
                    this.cleanupCarousel(modId);
                });
            }
        }, 300);
    }

    // Удаляем обработчик Escape
    if (this.currentEscapeHandler) {
        document.removeEventListener("keydown", this.currentEscapeHandler);
        this.currentEscapeHandler = null;
    }

    // Очищаем временные данные
    this.currentFullDescription = null;
    
    // 🔥 ОЧИЩАЕМ ДАННЫЕ ПРОСМОТРА ГАЛЕРЕИ
    if (this.galleryEscapeHandler) {
        document.removeEventListener("keydown", this.galleryEscapeHandler);
        this.galleryEscapeHandler = null;
    }
};

/**
 * Очистка временных данных источников
 */
UIManager.prototype.cleanupDownloadSources = function () {
    // Очищаем только временные источники
    Object.keys(this.downloadSourceFiles).forEach(key => {
        if (key.startsWith("temp_")) {
            delete this.downloadSourceFiles[key];
        }
    });
    Object.keys(this.downloadSourceStates).forEach(key => {
        if (key.startsWith("temp_")) {
            delete this.downloadSourceStates[key];
        }
    });

    console.log("Временные данные источника очищены");
};


const customCursor = document.getElementById('custom-cursor');
document.addEventListener('mousemove', (e) => 
{
    customCursor.style.left = `${e.clientX}px`;
    customCursor.style.top = `${e.clientY}px`;
});