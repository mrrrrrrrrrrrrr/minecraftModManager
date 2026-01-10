/**
 * Система рендеринга пользовательского интерфейса
 * Методы для отображения модов и коллекций в различных форматах
 */

/**
 * Рендеринг модов в режиме сетки (карточки)
 * Отображает моды в виде карточек с изображениями и основной информацией
 * @param {Array} modsToRender - массив модов для рендеринга
 */
UIManager.prototype.renderModsGrid = function (modsToRender) {
    // Всегда используем переданный массив или this.mods
    const mods = modsToRender !== null && modsToRender !== undefined ? modsToRender : this.mods;
    
    const container = document.getElementById("mods-grid-container");
    if (!container) return;

    // отображение пустого состояния если модов нет
    if (!mods || mods.length === 0) {
        container.innerHTML = `
            <div class="mods-loading">
                <div class="loading-spinner">📦</div>
                <p>Модов не найдено</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                    Попробуйте изменить условия поиска
                </p>
            </div>
        `;
        return;
    }

    // генерация HTML для каждой карточки мода
    container.innerHTML = mods.map(mod => {
        const mainDeveloper = mod.developers && mod.developers.length > 0 ? mod.developers[0] : null;
        const modJson = JSON.stringify(mod).replace(/"/g, "&quot;"); // экранирование для HTML

        // настройка стилей для карточек с изображениями
        const cardClass = mod.imageUrl ? "mod-card with-image" : "mod-card";
        const cardStyle = mod.imageUrl ? `--card-image: url('${mod.imageUrl}')` : "";

        return `
            <div class="${cardClass}" style="${cardStyle}">
                <div class="mod-header">
                    <button class="mod-title" onclick="uiManager.showModDetails(${modJson})">
                        ${this.escapeHtml(mod.title || "Без названия")}
                    </button>
                    ${mainDeveloper ? `
                        <div class="mod-developer">от ${this.escapeHtml(mainDeveloper.nickname)}</div>
                    ` : ""}
                </div>
                
                <div class="mod-content">
                    <!-- мета-информация о моде -->
                    <div class="mod-meta">
                        <div class="mod-type">
                            <span class="mod-type-icon">${mod.isClientside ? "🎮" : "🖥️"}</span>
                            <span>${mod.isClientside ? "Клиент" : "Сервер"}</span>
                        </div>
                        <div class="mod-stats">
                            <div class="mod-stat-item stat-downloads">
                                <span class="mod-stat-icon">⬇️</span>
                                <span class="mod-downloads">${this.formatNumber(mod.downloads || 0)}</span>
                            </div>
                            <div class="mod-stat-item stat-size">
                                <span class="mod-stat-icon">💾</span>
                                <span class="mod-size">${mod.size || 0} MB</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- отображение тегов (максимум 3 + счетчик) -->
                    ${mod.tags && mod.tags.length > 0 ? `
                        <div class="mod-tags">
                            ${mod.tags.slice(0, 3).map(tag =>
            `<span class="mod-tag">${this.escapeHtml(tag.title)}</span>`
        ).join("")}
                            ${mod.tags.length > 3 ? `<span class="mod-tag">+${mod.tags.length - 3}</span>` : ""}
                        </div>
                    ` : ""}
                    
                    <!-- отображение модлоадеров (максимум 3 + счетчик) -->
                    ${mod.modLoaders && mod.modLoaders.length > 0 ? `
                        <div class="mod-loaders">
                            ${mod.modLoaders.slice(0, 3).map(loader =>
            `<span class="mod-loader">${this.escapeHtml(loader.title)}</span>`
        ).join("")}
                            ${mod.modLoaders.length > 3 ? `<span class="mod-loader">+${mod.modLoaders.length - 3}</span>` : ""}
                        </div>
                    ` : ""}
                </div>
            </div>
        `;
    }).join(""); // объединяем все карточки в одну строку HTML
};

/**
 * Рендеринг модов в режиме таблицы
 * Отображает моды в виде таблицы с подробной информацией
 * @param {Array} modsToRender - массив модов для рендеринга
 */
UIManager.prototype.renderModsTable = function (modsToRender) {
    // Всегда используем переданный массив или this.mods
    const mods = modsToRender !== null && modsToRender !== undefined ? modsToRender : this.mods;
    
    const tbody = document.getElementById("mods-tbody");
    if (!tbody) return;

    // отображение пустого состояния если модов нет
    if (!mods || mods.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 3rem; color: #888;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                    <p>Модов не найдено</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                        Попробуйте изменить условия поиска
                    </p>
                </td>
            </tr>
        `;
        return;
    }

    // генерация HTML для каждой строки таблицы
    tbody.innerHTML = mods.map(mod => {
        const description = mod.description || "—";
        const isLongDescription = description.length > 100;
        const shortDescription = isLongDescription ? description.substring(0, 100) + "..." : description;

        return `
            <tr class="data-table-row">
                <!-- название и тип мода -->
                <td>
                    <p>${this.escapeHtml(mod.title || "Без названия")}</p>
                    ${mod.isClientside ? "<br><small>🎮 Клиентский</small>" : ""}
                </td>
                
                <!-- описание с возможностью развернуть -->
                <td>
                    <div class="mod-description-cell" title="${this.escapeHtml(description)}">
                        ${this.escapeHtml(shortDescription)}
                        ${isLongDescription ? "<br><small style=\"color: #666; cursor: pointer;\" onclick=\"uiManager.showFullDescription(this)\">показать полностью</small>" : ""}
                    </div>
                </td>
                
                <!-- версии, модлоадеры и теги -->
                <td>${this.renderTags(mod.versions)}</td>
                <td>${this.renderTags(mod.modLoaders)}</td>
                <td>${this.renderTags(mod.tags)}</td>
                
                <!-- размер файла -->
                <td>
                    <div>
                        <span>${mod.size || 0} MB</span>
                    </div>
                </td>
                
                <!-- количество скачиваний -->
                <td>
                    <div>
                        <span class="downloads-count">${this.formatNumber(mod.downloads || 0)}</span>
                    </div>
                </td>
                
                <!-- тип мода (клиент/сервер) -->
                <td>
                    <span class="badge ${mod.isClientside ? "badge-info" : "badge-warning"}">
                        ${mod.isClientside ? "🎮 Клиент" : "🖥️ Сервер"}
                    </span>
                </td>
                
                <!-- кнопки действий -->
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-warning" onclick="uiManager.editMod('${mod.id}')" title="Редактировать">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="uiManager.deleteMod('${mod.id}')" title="Удалить">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join(""); // объединяем все строки в одну строку HTML

    // обновление пагинации после рендеринга
    this.renderModPagination();
};

/**
 * Рендеринг коллекций в таблице
 * Отображает коллекции модов в табличном формате
 * @param {Array} collectionsToRender - опциональный массив коллекций для рендеринга
 */
UIManager.prototype.renderCollections = function (collectionsToRender = null) {
    const collections = collectionsToRender || this.collections; // используем переданные сборки или все сборки
    const tbody = document.getElementById("collections-tbody");
    if (!tbody) return;

    // отображение пустого состояния если коллекций нет
    if (collections.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 3rem; color: #888;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
                    <p>Сборок пока нет</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Создайте первую сборку!</p>
                </td>
            </tr>
        `;
        return;
    }

    // генерация HTML для каждой коллекции
    tbody.innerHTML = collections.map(collection => `
        <tr>
            <!-- название коллекции -->
            <td><strong>${this.escapeHtml(collection.name || "Без названия")}</strong></td>
            
            <!-- время прохождения -->
            <td>${collection.timeToComplete || 0} ч</td>
            
            <!-- версия minecraft -->
            <td>${collection.version ? `<span class="tag">${this.escapeHtml(collection.version.title)}</span>` : "—"}</td>
            
            <!-- модлоадер -->
            <td>${collection.modLoader ? `<span class="badge">${this.escapeHtml(collection.modLoader.title)}</span>` : "—"}</td>
            
            <!-- сложность -->
            <td>${collection.difficulty ? `<span class="badge">${this.escapeHtml(collection.difficulty.title)}</span>` : "—"}</td>
            
            <!-- фокусы/направления -->
            <td>${this.renderTags(collection.focuses)}</td>
            
            <!-- количество модов в коллекции -->
            <td><strong>${collection.mods?.length || 0}</strong></td>
            
            <!-- дата обновления -->
            <td>${new Date(collection.updatedAt).toLocaleDateString("ru-RU")}</td>
            
            <!-- кнопки действий -->
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-warning" onclick="uiManager.editCollection('${collection.id}')" title="Редактировать">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="uiManager.deleteCollection('${collection.id}')" title="Удалить">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join(""); // объединяем все строки в одну строку HTML
};

// Основные функции рендера
// ========================

/**
 * Основной метод рендеринга модов с учетом фильтров
 * Автоматически выбирает подходящий формат отображения на основе текущего режима
 */

UIManager.prototype.renderMods = function () {
    if (!this.mods || this.mods.length === 0) {
        this.renderModsGrid([]);
        this.renderModsTable([]);
        return;
    }
    
    // Управляем видимостью контейнеров
    this.toggleViewContainers();
    
    // Рендерим только активный вид
    if (this.currentView === "grid") {
        this.renderModsGrid(this.mods);
    } else {
        this.renderModsTable(this.mods);
    }
    
    this.updateSearchResultsInfo(this.totalMods || 0);
};


/**
 * Управление видимостью контейнеров грида и таблицы
 */
UIManager.prototype.toggleViewContainers = function() {
    const gridContainer = document.getElementById("mods-grid");
    const tableContainer = document.getElementById("mods-table-container");
    
    if (this.currentView === "grid") {
        gridContainer.style.display = "block";
        tableContainer.style.display = "none";
    } else {
        gridContainer.style.display = "none";
        tableContainer.style.display = "block";
    }
};