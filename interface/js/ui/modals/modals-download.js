/**
 * МОДАЛЬНОЕ ОКНО СКАЧИВАНИЯ МОДОВ
 * Отображение таблицы с вариантами скачивания
 */

/**
 * Открытие модального окна скачивания мода
 */
UIManager.prototype.openDownloadModal = async function(modId) {
    try {
        console.log('🎯 Открытие мода скачивания для мода:', modId);
        
        // Получаем данные мода и его источников
        const mod = await api.getModById(modId);
        const sources = await api.getDownloadSourcesByModId(modId);
        
        console.log('📦 Данные для скачивания:', {
            mod: mod,
            sources: sources
        });

        // Создаем модальное окно
        this.createDownloadModal(mod, sources);
        
    } catch (error) {
        console.error('❌ Ошибка открытия мода скачивания:', error);
        this.showMessage('❌ Ошибка загрузки данных для скачивания', 'error');
    }
};

/**
 * Создание модального окна скачивания
 */
UIManager.prototype.createDownloadModal = function(mod, sources) {
    const modalHtml = `
        <div class="download-modal-overlay active" id="download-modal">
            <div class="download-modal-container">
                <div class="download-modal-header">
                    <p>${this.escapeHtml(mod.title)}</p>
                    <button class="download-modal-close" onclick="uiManager.closeDownloadModal()">×</button>
                </div>
                
                <div class="download-modal-body">
                    ${sources.length === 0 ? `
                        <div class="download-empty-state">
                            <p>😔 Нет доступных источников для скачивания</p>
                        </div>
                    ` : `
                        <div class="download-table-container">
                            <table class="download-table">
                                <thead>
                                    <tr>
                                        <th>Версии</th>
                                        <th>Модлоадеры</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sources.map(source => this.renderDownloadSourceRow(source)).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
                
                <div class="download-modal-footer">
                    <button class="btn btn-secondary" onclick="uiManager.closeDownloadModal()">Закрыть</button>
                </div>
            </div>
        </div>
    `;

    // Добавляем модальное окно в DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

/**
 * Рендер строки таблицы для источника скачивания
 */
UIManager.prototype.renderDownloadSourceRow = function(source) {
    const versions = source.versions?.map(v => v.title).join(', ') || 'Не указано';
    const modLoaders = source.modLoaders?.map(ml => ml.title).join(', ') || 'Не указано';
    const hasFile = !!source.filePath;
    const hasUrl = !!source.url;

    // Извлекаем имя файла из filePath
    const fileName = source.filePath ? source.filePath.split('/').pop() : null;
    const originalFileName = source.originalFileName || source.fileName;

    // 🔥 Нормализуем URL для внешней ссылки
    const normalizedUrl = hasUrl ? this.normalizeUrl(source.url) : null;

    return `
        <tr class="download-source-row">
            <td class="versions-cell">
                <div class="versions-list">${versions}</div>
            </td>
            <td class="modloaders-cell">
                <div class="modloaders-list">${modLoaders}</div>
            </td>
            <td class="actions-cell">
                <div class="download-actions">
                    ${hasFile ? `
                        <button class="btn btn-primary btn-sm" 
                                onclick="uiManager.downloadFile('${fileName}', '${originalFileName}')"
                                title="Скачать файл">
                            ⬇️ Скачать
                        </button>
                    ` : `
                        <button class="btn btn-primary btn-sm" disabled title="Файл недоступен">
                            ⬇️ Скачать
                        </button>
                    `}
                    
                    ${hasUrl ? `
                        <button class="btn btn-secondary btn-sm" 
                                onclick="uiManager.openExternalLink('${normalizedUrl}')"
                                title="Перейти по внешней ссылке">
                            🌐 Внешняя ссылка
                        </button>
                    ` : `
                        <button class="btn btn-secondary btn-sm" disabled title="Внешняя ссылка отсутствует">
                            🌐 Внешняя ссылка
                        </button>
                    `}
                </div>
            </td>
        </tr>
    `;
};

/**
 * Открытие внешней ссылки с нормализацией URL
 */
UIManager.prototype.openExternalLink = function(url) {
    try {
        console.log('🔗 Открытие внешней ссылки:', url);
        
        // Дополнительная проверка и нормализация
        const finalUrl = this.normalizeUrl(url);
        
        // Открываем в новой вкладке
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
        
    } catch (error) {
        console.error('❌ Ошибка открытия внешней ссылки:', error);
        this.showMessage('❌ Неверная ссылка', 'error');
    }
};

/**
 * Нормализация URL - добавление протокола если нужно
 */
UIManager.prototype.normalizeUrl = function(url) {
    if (!url) return '';
    
    // Убираем пробелы в начале и конце
    url = url.trim();
    
    // Если URL уже содержит протокол - возвращаем как есть
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // Если URL начинается с www. - добавляем https://
    if (url.startsWith('www.')) {
        return 'https://' + url;
    }
    
    // Для остальных случаев добавляем https://
    // (предполагаем что это домен без www)
    return 'https://' + url;
};

/**
 * Скачивание файла с сервера
 */
UIManager.prototype.downloadFile = async function(fileName, originalFileName) {
    try {
        console.log('📥 Начинаем скачивание файла:', fileName);
        
        const blob = await api.downloadModFile(fileName);
        
        // Создаем ссылку для скачивания
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalFileName || fileName;
        document.body.appendChild(a);
        a.click();
        
        // Очищаем
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ Файл успешно скачан:', fileName);
        
    } catch (error) {
        console.error('❌ Ошибка скачивания файла:', error);
        this.showMessage('❌ Ошибка при скачивании файла', 'error');
    }
};

/**
 * Закрытие модального окна скачивания
 */
UIManager.prototype.closeDownloadModal = function() {
    const modal = document.getElementById('download-modal');
    if (modal) {
        modal.remove();
    }
};

/**
 * Вспомогательные функции
 */

/**
 * Обрезание длинного URL для отображения
 */
UIManager.prototype.truncateUrl = function(url, maxLength = 30) {
    if (!url) return '';
    
    // Нормализуем URL для отображения
    const normalized = this.normalizeUrl(url);
    if (normalized.length <= maxLength) return normalized;
    
    return normalized.substring(0, maxLength - 3) + '...';
};

/**
 * Экранирование HTML
 */
UIManager.prototype.escapeHtml = function(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};