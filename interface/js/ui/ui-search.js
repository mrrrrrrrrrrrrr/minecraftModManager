// Инициализация поиска и фильтров
UIManager.prototype.initSearchAndFilters = function() {
    // Задаём базовые параметры и значения
    this.pageSize = 3;
    this.currentPage = 1;
    this.totalMods = 0;
    this.totalPages = 1;

    this.currentFilters = {
        search: "",
        versionIds: [],
        modLoaderIds: [],
        tagIds: [],
        developers: [],
        isClientside: undefined,
        minDownloads: 0,
        maxSize: 0
    };
    
    // Создаём интерфейс и навешиваем события
    this.createSearchInterface();
    this.initSearchEvents();
    
    // Загружаем данные для фильтров и первые моды
    setTimeout(() => this.loadFilterData(), 100);
};

// Создание поискового интерфейса и фильтров
UIManager.prototype.createSearchInterface = function() {
    const modsTab = document.getElementById("mods-tab");
    if (!modsTab) return;
    
    const tableHeader = modsTab.querySelector(".table-header");
    if (!tableHeader) return;
    
    const container = document.createElement("div");
    container.className = "search-filters-container";
    container.innerHTML = `
        <div class="search-header">
            <div class="search-input-group">
                <div class="view-toggle">
                    <button class="view-btn grid active" data-view="grid" onclick="uiManager.switchView('grid')">Грид</button>
                    <button class="view-btn list" data-view="table" onclick="uiManager.switchView('table')">Таблица</button>
                </div>
                <input type="text" id="mods-search" placeholder="Поиск модов..." class="search-input">
                <button id="toggle-filters" class="btn btn-primary" style="width: 20%">Фильтры</button>
                <button id="clear-search" class="btn btn-secondary btn-sm" style="display: none;">Сбросить</button>
            </div>
            
            <div id="search-results-info" class="search-results-info">
                Загрузка модов...
            </div>
            
            <div id="search-loading" class="search-loading" style="display: none;">
                Поиск...
            </div>
        </div>

        <div id="grid-pagination" class="grid-pagination" style="display: flex; margin: 1rem 0; justify-content: center; gap: 1rem;">
            <button id="grid-prev-page" class="btn btn-secondary btn-sm" disabled>Назад</button>
            <span id="grid-page-info" style="align-self: center; font-weight: 500;">Страница 1</span>
            <button id="grid-next-page" class="btn btn-primary btn-sm" disabled>Вперёд</button>
        </div>

        <div id="filters-panel" class="filters-panel" style="display: none;">
            <div class="filters-grid">
                <div class="filter-group">
                    <label>Версии игры</label>
                    <div id="filter-versions" class="filter-options"><div>Загрузка...</div></div>
                </div>
                <div class="filter-group">
                    <label>Модлоадеры</label>
                    <div id="filter-modloaders" class="filter-options"><div>Загрузка...</div></div>
                </div>
                <div class="filter-group">
                    <label>Разработчики</label>
                    <div id="filter-developers" class="filter-options"><div>Загрузка...</div></div>
                </div>
                <div class="filter-group">
                    <label>Теги</label>
                    <div id="filter-tags" class="filter-options"><div>Загрузка...</div></div>
                </div>
                <div class="filter-group">
                    <label>Тип мода</label>
                    <div>
                        <label><input type="radio" name="mod-type" value="all" checked> Все</label>
                        <label><input type="radio" name="mod-type" value="true"> Клиентский</label>
                        <label><input type="radio" name="mod-type" value="false"> Серверный</label>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Минимум скачиваний</label>
                    <input type="number" id="min-downloads" min="0" placeholder="0" class="range-input">
                    <label>Максимальный размер (MB)</label>
                    <input type="number" id="max-size" min="0" step="0.1" placeholder="Любой" class="range-input">
                </div>
            </div>
            <div class="filter-actions">
                <button id="apply-filters" class="btn btn-primary">Применить</button>
                <button id="reset-filters" class="btn btn-secondary">Сбросить</button>
            </div>
        </div>
    `;

    tableHeader.parentNode.insertBefore(container, tableHeader);
};

// Загрузка данных для фильтров (версии, загрузчики, теги, разработчики)
UIManager.prototype.loadFilterData = async function() {
    try {
        this.showLoading(true);

        const [versionsData, loadersData, tagsData, devsData] = await Promise.all([
            api.getVersions(),
            api.getModLoaders(),
            api.getTags(),
            api.getDevelopers()
        ]);
        
        this.availableVersions = versionsData.items || [];
        this.availableModLoaders = loadersData.items || [];
        this.availableTags = tagsData.items || [];
        this.availableDevelopers = devsData.items || [];

        this.fillFilterOptions();
        await this.performSearch();
    } catch (error) {
        this.showError("Не удалось загрузить фильтры");
    } finally {
        this.showLoading(false);
    }
};

// Заполнение интерфейса фильтров по данным
UIManager.prototype.fillFilterOptions = function() {
    const versionsContainer = document.getElementById("filter-versions");
    if (versionsContainer && this.availableVersions.length) {
        versionsContainer.innerHTML = this.availableVersions.map(v => `
            <label><input type="checkbox" name="version" value="${v.id}"> ${this.escapeHtml(v.title)}</label>
        `).join("");
    }

    const loadersContainer = document.getElementById("filter-modloaders");
    if (loadersContainer && this.availableModLoaders.length) {
        loadersContainer.innerHTML = this.availableModLoaders.map(l => `
            <label><input type="checkbox" name="modloader" value="${l.id}"> ${this.escapeHtml(l.title)}</label>
        `).join("");
    }

    const tagsContainer = document.getElementById("filter-tags");
    if (tagsContainer && this.availableTags.length) {
        tagsContainer.innerHTML = this.availableTags.map(t => `
            <label><input type="checkbox" name="tag" value="${t.id}"> ${this.escapeHtml(t.title)}</label>
        `).join("");
    }

    const devsContainer = document.getElementById("filter-developers");
    if (devsContainer && this.availableDevelopers.length) {
        devsContainer.innerHTML = this.availableDevelopers.map(d => `
            <label><input type="checkbox" name="developer" value="${d.id}"> ${this.escapeHtml(d.nickname)}</label>
        `).join("");
    }
};

// Навешиваем события на элементы интерфейса
UIManager.prototype.initSearchEvents = function() {
    const searchInput = document.getElementById("mods-search");
    const clearSearchBtn = document.getElementById("clear-search");
    const toggleFiltersBtn = document.getElementById("toggle-filters");
    const filtersPanel = document.getElementById("filters-panel");
    const applyFiltersBtn = document.getElementById("apply-filters");
    const resetFiltersBtn = document.getElementById("reset-filters");

    if (searchInput) {
        searchInput.addEventListener("input", this.debounce(e => {
            this.currentFilters.search = e.target.value.trim();
            clearSearchBtn.style.display = this.currentFilters.search ? "block" : "none";
            this.currentPage = 1;
            this.performSearch();
        }, 500));
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            this.currentFilters.search = "";
            clearSearchBtn.style.display = "none";
            this.currentPage = 1;
            this.performSearch();
        });
    }

    if (toggleFiltersBtn && filtersPanel) {
        toggleFiltersBtn.addEventListener("click", () => {
            const isVisible = filtersPanel.style.display === "block";
            filtersPanel.style.display = isVisible ? "none" : "block";
            toggleFiltersBtn.textContent = isVisible ? "Фильтры" : "Закрыть";
        });
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener("click", () => {
            this.collectFilterValues();
            this.currentPage = 1;
            this.performSearch();
            filtersPanel.style.display = "none";
            toggleFiltersBtn.textContent = "Фильтры";
        });
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener("click", () => {
            this.resetFilters();
            this.performSearch();
        });
    }

    const prevPageBtn = document.getElementById("grid-prev-page");
    const nextPageBtn = document.getElementById("grid-next-page");

    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.performSearch();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.performSearch();
            }
        });
    }

    // Автоматическое обновление поиска при изменении фильтров
    ['version', 'modloader', 'developer', 'tag'].forEach(name => {
        document.querySelectorAll(`input[name="${name}"]`).forEach(checkbox => {
            checkbox.addEventListener("change", this.debounce(() => {
                this.collectFilterValues();
                this.currentPage = 1;
                this.performSearch();
            }, 300));
        });
    });

    // Фильтр по типу мода
    document.querySelectorAll('input[name="mod-type"]').forEach(radio => {
        radio.addEventListener("change", this.debounce(() => {
            this.collectFilterValues();
            this.currentPage = 1;
            this.performSearch();
        }, 300));
    });

    // Фильтры по числовым значениям
    const minDownloadsInput = document.getElementById("min-downloads");
    const maxSizeInput = document.getElementById("max-size");

    if (minDownloadsInput) {
        minDownloadsInput.addEventListener("input", this.debounce(() => {
            this.collectFilterValues();
            this.currentPage = 1;
            this.performSearch();
        }, 500));
    }

    if (maxSizeInput) {
        maxSizeInput.addEventListener("input", this.debounce(() => {
            this.collectFilterValues();
            this.currentPage = 1;
            this.performSearch();
        }, 500));
    }
};

// Сбор значений фильтров с формы, чтобы отправить на сервер
UIManager.prototype.collectFilterValues = function() {
    this.currentFilters.versionIds = Array.from(document.querySelectorAll('input[name="version"]:checked')).map(cb => cb.value);
    this.currentFilters.modLoaderIds = Array.from(document.querySelectorAll('input[name="modloader"]:checked')).map(cb => cb.value);
    this.currentFilters.developers = Array.from(document.querySelectorAll('input[name="developer"]:checked')).map(cb => cb.value);
    this.currentFilters.tagIds = Array.from(document.querySelectorAll('input[name="tag"]:checked')).map(cb => cb.value);

    const modTypeRadio = document.querySelector('input[name="mod-type"]:checked');
    this.currentFilters.isClientside = modTypeRadio ? modTypeRadio.value === "true" : false;

    const minDownloadsInput = document.getElementById("min-downloads");
    this.currentFilters.minDownloads = minDownloadsInput?.value ? parseInt(minDownloadsInput.value) : 0;

    const maxSizeInput = document.getElementById("max-size");
    this.currentFilters.maxSize = maxSizeInput?.value ? parseFloat(maxSizeInput.value) : 0;
};

// Выполняем запрос к серверу с текущими параметрами поиска и фильтров
UIManager.prototype.performSearch = async function() {
    this.showLoading(true);

    try {
        const params = {
            pageNumber: this.currentPage,
            pageSize: this.pageSize,
            search: this.currentFilters.search,
            isClientside: this.currentFilters.isClientside,
            minDownloads: this.currentFilters.minDownloads,
            maxSize: this.currentFilters.maxSize,
            versionIds: this.currentFilters.versionIds,
            modLoaderIds: this.currentFilters.modLoaderIds,
            tagIds: this.currentFilters.tagIds,
            developers: this.currentFilters.developers,
            sortBy: "CreatedAt",
            orderBy: "desc"
        };

        const result = await api.searchMods(params);

        this.mods = result.items || [];
        this.totalMods = result.totalCount || 0;
        this.totalPages = Math.ceil(this.totalMods / this.pageSize);

        this.renderMods();
        this.updateSearchResultsInfo(this.totalMods);
        this.updateGridPagination();
    } catch (e) {
        this.showError("Ошибка при поиске модов");
    } finally {
        this.showLoading(false);
    }
};

// Обновляем кнопки и статус пагинации грида
UIManager.prototype.updateGridPagination = function() {
    const pageInfo = document.getElementById("grid-page-info");
    pageInfo.textContent = `Страница ${this.currentPage} из ${this.totalPages}`;

    const prevBtn = document.getElementById("grid-prev-page");
    const nextBtn = document.getElementById("grid-next-page");

    prevBtn.disabled = this.currentPage <= 1;
    nextBtn.disabled = this.currentPage >= this.totalPages;
};

// Обновляем информацию о количестве найденных модов и текущей странице
UIManager.prototype.updateSearchResultsInfo = function(totalCount) {
    const info = document.getElementById("search-results-info");
    const searchText = this.currentFilters.search ? ` по запросу "${this.currentFilters.search}"` : "";
    const pageInfo = this.totalPages > 1 ? ` (стр. ${this.currentPage}/${this.totalPages})` : "";
    info.textContent = `Найдено: ${totalCount} модов${searchText}${pageInfo}`;
};

UIManager.prototype.switchView = function(view) {
    this.currentView = view;
    
    // Обновляем активные кнопки
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });
    
    // Перерисовываем моды и меняем видимость контейнеров
    this.renderMods();
};


// Показываем или скрываем индикатор загрузки
UIManager.prototype.showLoading = function(show) {
    const loading = document.getElementById("search-loading");
    if (loading) loading.style.display = show ? "block" : "none";
};

// Показываем сообщение об ошибке
UIManager.prototype.showError = function(msg) {
    const info = document.getElementById("search-results-info");
    if (info) {
        info.textContent = `Ошибка: ${msg}`;
        info.style.color = "red";
    }
};

// Функция, которая ограничивает частоту вызовов для оптимизации поиска
UIManager.prototype.debounce = function(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    }.bind(this);
};

UIManager.prototype.resetFilters = function() {
    // Очищаем поле поиска
    const searchInput = document.getElementById("mods-search");
    if (searchInput) searchInput.value = "";
    
    // Снимаем все чекбоксы фильтров
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    // Сбрасываем радио кнопки типа мода на "Все"
    const allRadio = document.querySelector('input[name="mod-type"][value="all"]');
    if (allRadio) allRadio.checked = true;
    
    // Очищаем диапазоны скачиваний и размера
    document.querySelectorAll(".range-input").forEach(input => {
        input.value = "";
    });
    
    // Сбрасываем объект текущих фильтров в UIManager
    this.currentFilters = {
        search: "",
        versionIds: [],
        modLoaderIds: [],
        tagIds: [],
        developers: [],
        isClientside: false,
        minDownloads: 0,
        maxSize: 0
    };
    
    // Возвращаемся на первую страницу
    this.currentPage = 1;
};
