/**
 * Система инициализации событий пользовательского интерфейса
 * Обработчики событий для взаимодействия с UI компонентами
 */

/**
 * Инициализация статических обработчиков событий
 * События, которые не меняются в течение жизненного цикла приложения
 */
UIManager.prototype.initStaticEventListeners = function () {
    console.log("Инициализация статических событий...");

    // переключение между формами аутентификации
    const switchToRegister = document.getElementById("switch-to-register");
    const switchToLogin = document.getElementById("switch-to-login");

    // переключение на форму регистрации
    if (switchToRegister) {
        switchToRegister.addEventListener("click", (e) => {
            e.preventDefault(); // предотвращаем стандартное поведение ссылки
            authManager.showRegisterForm();
        });
    }

    // переключение на форму входа
    if (switchToLogin) {
        switchToLogin.addEventListener("click", (e) => {
            e.preventDefault(); // предотвращаем стандартное поведение ссылки
            authManager.showLoginForm();
        });
    }

    console.log("Статические события инициализированы");
};

/**
 * Инициализация динамических обработчиков событий
 * События для интерактивных элементов управления интерфейсом
 */
UIManager.prototype.initDynamicEventListeners = function () {
    console.log("Инициализация динамических событий...");

    // переключение вкладок (Моды/Коллекции)
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => this.switchTab(e.target.dataset.tab));
    });

    // переключение режима просмотра (Сетка/Таблица)
    document.querySelectorAll(".view-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            this.switchView(e.target.dataset.view);
        });
    });

    // кнопки добавления новых элементов
    const addModBtn = document.getElementById("add-mod-btn");
    if (addModBtn) {
        console.log('Кнопка "Добавить мод" найдена');
        addModBtn.addEventListener("click", () => this.showAddModModal());
    }

    const addCollectionBtn = document.getElementById("add-collection-btn");
    if (addCollectionBtn) {
        addCollectionBtn.addEventListener("click", () => this.showAddCollectionModal());
    }
    
    //для поиска
    document.getElementById("grid-prev-page")?.addEventListener("click", () => {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.performSearch();
        }
    });

    document.getElementById("grid-next-page")?.addEventListener("click", () => {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.performSearch();
        }
    });

    this.toggleViewContainers();

    // кнопка обновления данных
    const refreshBtn = document.getElementById("refresh-mods");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => this.loadAllData());
    }

    // система быстрого добавления элементов
    document.querySelectorAll(".quick-form button").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault(); // предотвращаем отправку формы
            const type = btn.dataset.type; // получаем тип элемента из data-атрибута
            this.handleQuickAdd(type);
        });
    });

    // инициализация системы загрузки файлов
    this.initFileUpload();

    console.log("Динамические события инициализированы");
};

// Система переключения режимов отображения
// ========================================

/**
 * Переключение режима отображения модов
 * @param {string} viewType - тип отображения ('grid' или 'table')
 */
UIManager.prototype.switchView = function (viewType) {
    this.currentView = viewType; // сохраняем текущий режим просмотра

    // получение DOM-элементов для различных режимов
    const gridContainer = document.getElementById("mods-grid");
    const tableContainer = document.getElementById("mods-table-container");
    const viewBtns = document.querySelectorAll(".view-btn");

    // обновление активного состояния кнопок переключения
    viewBtns.forEach(btn => btn.classList.remove("active"));
    document.querySelector(`[data-view="${viewType}"]`).classList.add("active");

    // переключение видимости контейнеров и рендеринг
    if (viewType === "grid") {
        // режим сетки - показываем карточки, скрываем таблицу
        gridContainer.style.display = "block";
        tableContainer.style.display = "none";
        this.renderModsGrid();
    } else {
        // режим таблицы - скрываем карточки, показываем таблицу
        gridContainer.style.display = "none";
        tableContainer.style.display = "block";
        this.renderModsTable();
    }
};

/**
 * Переключение между вкладками интерфейса
 * @param {string} tabName - имя вкладки для активации
 */
UIManager.prototype.switchTab = function (tabName) {
    // сброс активного состояния у всех вкладок
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));

    // установка активного состояния выбранной вкладки
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
    document.getElementById(`${tabName}-tab`).classList.add("active");
};

// Система работы с файлами и изображениями
// ========================================

/**
 * Инициализация системы работы с файлами
 * Глобальный обработчик для всех file input элементов
 */
UIManager.prototype.initFileUpload = function () {
    document.addEventListener("change", (e) => {
        if (e.target.type === "file") {
            this.handleFileSelect(e.target);
        }
    });
};

/**
 * Обработка выбранного файла
 * @param {HTMLInputElement} input - file input элемент
 */
UIManager.prototype.handleFileSelect = function (input) {
    const file = input.files[0];
    if (!file) return; // если файл не выбран, выходим

    // валидация размера файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
        this.showMessage("Файл слишком большой (макс. 5MB)", "error");
        input.value = ""; // очищаем поле ввода
        return;
    }

    // показ превью выбранного изображения
    this.showFilePreview(input.id, file);
};

/**
 * Отображение превью выбранного файла
 * @param {string} inputId - ID file input элемента
 * @param {File} file - выбранный файл изображения
 */
UIManager.prototype.showFilePreview = function (inputId, file) {
    const previewContainer = document.getElementById(`${inputId}-preview`);
    if (!previewContainer) return; // если контейнер превью не найден

    const previewImage = previewContainer.querySelector(".file-preview-image");
    const fileInput = document.getElementById(inputId);

    // чтение файла и отображение превью
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result; // устанавливаем Data URL в изображение
        previewContainer.style.display = "flex"; // показываем контейнер превью
        if (fileInput) {
            fileInput.style.display = "none"; // скрываем оригинальный input
        }
    };
    reader.readAsDataURL(file); // читаем файл как Data URL
};

/**
 * Удаление превью файла и восстановление input
 * @param {string} inputId - ID file input элемента
 */
UIManager.prototype.removeFilePreview = function (inputId) {
    const previewContainer = document.getElementById(`${inputId}-preview`);
    const fileInput = document.getElementById(inputId);

    // сброс интерфейса к исходному состоянию
    if (previewContainer) {
        previewContainer.style.display = "none"; // скрываем контейнер превью
    }
    if (fileInput) {
        fileInput.style.display = "block"; // показываем оригинальный input
        fileInput.value = ""; // очищаем значение input
    }
};