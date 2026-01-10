/**
 * Основной класс управления пользовательским интерфейсом
 * Центральный класс для управления всеми UI компонентами приложения
 */

console.log("Загрузка UI Core...");

class UIManager {
    constructor() {
        console.log("Создание UIManager...");

        // данные приложения
        this.mods = [];           // список всех модов
        this.collections = [];    // список всех коллекций

        // справочные данные (загружаются с сервера)
        this.availableVersions = [];      // доступные версии Minecraft
        this.availableModLoaders = [];    // доступные модлоадеры (Forge, Fabric и т.д.)
        this.availableTags = [];          // теги для категоризации модов
        this.availableDevelopers = [];    // разработчики модов
        this.availableDifficulties = [];  // уровни сложности сборок
        this.availableFocuses = [];       // направления/фокусы сборок

        // настройки пагинации
        this.currentModPage = 1;          // текущая страница модов
        this.currentCollectionPage = 1;   // текущая страница коллекций
        this.pageSize = 3;               // количество элементов на странице
        this.totalMods = 0;               // общее количество модов
        this.totalCollections = 0;        // общее количество коллекций

        // настройки отображения
        this.currentView = "grid";        // текущий режим просмотра ('grid' или 'table')

        // фильтры поиска
        this.currentFilters = {
            searchText: "",
            versions: [],
            modLoaders: [],
            developers: [],
            tags: [],
            modType: "all",
            minDownloads: null,
            maxDownloads: null,
            minSize: null,
            maxSize: null
        };

        // отложенная инициализация (после загрузки DOM)
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this.delayedInit());
        } else {
            this.delayedInit();
        }
    }

    /**
     * отложенная инициализация интерфейса
     * выполняется после полной загрузки DOM дерева
     */
    delayedInit() {
        console.log("Отложенная инициализация UI...");
        this.initStaticEventListeners();  // инициализация статических обработчиков событий
    }

}

// создание глобального экземпляра UIManager
window.uiManager = new UIManager();