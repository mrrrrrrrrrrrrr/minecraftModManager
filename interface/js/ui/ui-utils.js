/**
 * Вспомогательные функции и утилиты
 * Общие методы для работы с данными, форматирования и утилитарные функции
 */

/**
 * Рендеринг тегов и элементов списка
 * Преобразует массив элементов в HTML-строку тегов с ограничением количества
 * @param {Array} items - массив элементов для отображения (версии, теги, разработчики и т.д.)
 * @returns {string} HTML-строка с тегами или прочерком если массив пуст
 */
UIManager.prototype.renderTags = function (items) {
    // проверка на пустой массив
    if (!items || items.length === 0) return "<span style=\"color: #888\">—</span>";

    // ограничение количества отображаемых элементов (максимум 3)
    return items.slice(0, 3).map(item =>
            `<span class="tag" title="${this.escapeHtml(item.title || item.name || item.nickname)}">
            ${this.escapeHtml(item.title || item.name || item.nickname)}
        </span>`
        ).join("") +
        // добавление счетчика если элементов больше 3
        (items.length > 3 ? `<span class="tag">+${items.length - 3}</span>` : "");
};

/**
 * Форматирование чисел для человеческого восприятия
 * Преобразует большие числа в сокращенный формат (тыс., M)
 * @param {number} num - число для форматирования
 * @returns {string} отформатированная строка числа
 */
UIManager.prototype.formatNumber = function (num) {
    // форматирование миллионов (1.5M)
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    // форматирование тысяч (1.5тыс.)
    else if (num >= 1000) {
        return (num / 1000).toFixed(1) + "тыс.";
    }
    // возврат оригинального числа для маленьких значений
    return num.toString();
};

/**
 * Экранирование HTML-символов для безопасности
 * Защита от XSS-атак путем замены опасных символов на HTML-сущности
 * @param {string} unsafe - небезопасная строка с HTML-символами
 * @returns {string} безопасная экранированная строка
 */
UIManager.prototype.escapeHtml = function (unsafe) {
    if (!unsafe) return ""; // возврат пустой строки для нулевых значений

    return unsafe
        .toString()
        .replace(/&/g, "&amp;")   // экранирование амперсандов
        .replace(/</g, "&lt;")    // экранирование знаков "меньше"
        .replace(/>/g, "&gt;")    // экранирование знаков "больше"
        .replace(/"/g, "&quot;")  // экранирование двойных кавычек
        .replace(/'/g, "&#039;"); // экранирование одинарных кавычек
};

/**
 * Получение человеко-читаемого имени типа элемента
 * Преобразует системное имя типа в красивое отображаемое имя
 * @param {string} type - системное имя типа (version, modloader, tag и т.д.)
 * @returns {string} человеко-читаемое имя типа
 */
UIManager.prototype.getTypeName = function (type) {
    // словарь соответствий системных имен человеко-читаемым
    const names = {
        "version": "Версия",
        "modloader": "Модлоадер",
        "tag": "Тег",
        "developer": "Разработчик",
        "difficulty": "Сложность",
        "focus": "Фокус"
    };
    return names[type] || type; // возврат имени из словаря или оригинала
};

/**
 * Показ системных сообщений пользователю
 * Упрощенная система уведомлений через alert (можно заменить на toast-уведомления)
 * @param {string} message - текст сообщения
 * @param {string} type - тип сообщения ('success' или 'error')
 */
UIManager.prototype.showMessage = function (message, type) {
    alert(`${type === "success" ? "✅" : "❌"} ${message}`);
};

/**
 * Обновление статистики в интерфейсе
 * Обновляет счетчики элементов в реальном времени на основе текущих данных
 */
UIManager.prototype.updateStats = function () {
    // вспомогательная функция для обновления отдельного счетчика
    const updateCounter = (id, count) => {
        const element = document.getElementById(id);
        if (element) element.textContent = count;
    };

    // обновление всех счетчиков статистики
    updateCounter("mods-count", this.totalMods);              // количество модов
    updateCounter("collections-count", this.totalCollections); // количество коллекций
    updateCounter("tags-count", this.availableTags.length);   // количество тегов
    updateCounter("developers-count", this.availableDevelopers.length); // количество разработчиков
};