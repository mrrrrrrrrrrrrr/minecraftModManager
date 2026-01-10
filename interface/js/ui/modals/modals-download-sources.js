/**
 * СИСТЕМА ИСТОЧНИКОВ СКАЧИВАНИЯ
 * Управление файлами и ссылками для скачивания модов
 */

// Глобальное хранилище файлов и состояний источников
UIManager.prototype.downloadSourceFiles = {};
UIManager.prototype.downloadSourceStates = {};

/**
 * Добавление нового источника скачивания
 */
UIManager.prototype.addDownloadSource = function (fieldId) {
    const list = document.getElementById(`${fieldId}-list`);
    if (!list) return;

    const sourceId = 'temp_' + Date.now() + '_' + Math.random();
    
    // ИНИЦИАЛИЗИРУЕМ ПУСТОЕ СОСТОЯНИЕ
    this.downloadSourceStates[sourceId] = {
        url: '',
        file: null,
        filePath: null,
        fileName: null
    };
    
    const sourceHtml = `
        <div class="download-source-item" data-id="${sourceId}" data-temp="true">
            <!-- Версии -->
            <div class="source-multi-section">
                <div class="section-header">
                    <span class="section-title">🔢 Версии</span>
                    <span class="selection-count">0</span>
                </div>
                <div class="section-content">
                    <div class="compact-checkbox-grid">
                        ${this.availableVersions.map(v => `
                            <label class="compact-checkbox version-option" onclick="uiManager.toggleSourceCheckbox(this, '${sourceId}', 'version')">
                                <input type="checkbox" value="${v.id}" class="source-version-cb">
                                <span class="checkbox-label">${v.title}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="section-actions">
                        <button type="button" class="btn-select-all" onclick="uiManager.selectAllSource('${sourceId}', 'version')">
                            Выбрать все
                        </button>
                        <button type="button" class="btn-deselect-all" onclick="uiManager.deselectAllSource('${sourceId}', 'version')">
                            Очистить
                        </button>
                    </div>
                </div>
            </div>

            <!-- Модлоадеры -->
            <div class="source-multi-section">
                <div class="section-header">
                    <span class="section-title">🛠️ Модлоадеры</span>
                    <span class="selection-count">0</span>
                </div>
                <div class="section-content">
                    <div class="compact-checkbox-grid">
                        ${this.availableModLoaders.map(ml => `
                            <label class="compact-checkbox loader-option" onclick="uiManager.toggleSourceCheckbox(this, '${sourceId}', 'modloader')">
                                <input type="checkbox" value="${ml.id}" class="source-modloader-cb">
                                <span class="checkbox-label">${ml.title}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="section-actions">
                        <button type="button" class="btn-select-all" onclick="uiManager.selectAllSource('${sourceId}', 'modloader')">
                            Выбрать все
                        </button>
                        <button type="button" class="btn-deselect-all" onclick="uiManager.deselectAllSource('${sourceId}', 'modloader')">
                            Очистить
                        </button>
                    </div>
                </div>
            </div>

            <!-- Ссылка/файл -->
            <div class="source-input-section">
                <div class="section-header">
                    <span class="section-title">📥 Ссылка И файл</span>
                    <span class="source-type-indicator" style="font-size: 0.8rem;">🔗 Можно указать оба</span>
                </div>
                <div class="section-content">
                    <div class="source-input-container">
                        <input type="text" class="source-url" placeholder="https://curseforge.com/..." value="">
                        <input type="file" class="source-file" style="display: none;" 
                               accept=".jar,.zip,.rar,.7z,.JAR,.ZIP,.RAR,.7Z">
                        <div class="source-type-toggle">
                            <button type="button" class="btn-type-url active" data-type="url" title="Показать ссылку">🔗</button>
                            <button type="button" class="btn-type-file" data-type="file" title="Показать файл">📁</button>
                            <button type="button" class="btn btn-sm btn-danger" onclick="uiManager.removeDownloadSource('${sourceId}')" title="Удалить источник">🗑️ Удалить</button>
                        </div>
                    </div>
                    <div class="file-info" style="margin-top: 10px; padding: 8px; background: var(--bg-primary); border-radius: var(--border-radius); display: none;">
                        <small>📎 Выбран файл: <span class="file-name">[имя файла]</span></small>
                    </div>
                    <div class="url-info" style="margin-top: 10px; padding: 8px; background: var(--bg-primary); border-radius: var(--border-radius); display: none;">
                        <small>🔗 Ссылка: <span class="url-value">[ссылка]</span></small>
                    </div>
                </div>
            </div>
        </div>
    `;

    list.insertAdjacentHTML('beforeend', sourceHtml);
    this.initDownloadSourceEvents(sourceId);
};

/**
 * Инициализация событий для источника скачивания
 */
UIManager.prototype.initDownloadSourceEvents = function (sourceId) {
    const item = document.querySelector(`[data-id="${sourceId}"]`);
    if (!item) {
        console.error('❌ Элемент источника не найден:', sourceId);
        return;
    }

    const urlBtn = item.querySelector('.btn-type-url');
    const fileBtn = item.querySelector('.btn-type-file');
    const urlInput = item.querySelector('.source-url');
    const fileInput = item.querySelector('.source-file');
    const fileInfo = item.querySelector('.file-info');
    const fileName = item.querySelector('.file-name');
    const typeIndicator = item.querySelector('.source-type-indicator');

    // НОВАЯ ЛОГИКА: Сохраняем ВСЕ данные, переключение - только UI
    if (!this.downloadSourceStates[sourceId]) {
        const existingUrl = urlInput ? urlInput.value.trim() : '';
        const existingFile = this.downloadSourceFiles[sourceId] || null;
        const isUrlActive = urlBtn ? urlBtn.classList.contains('active') : true;
        
        this.downloadSourceStates[sourceId] = {
            url: existingUrl,
            file: existingFile,
            // ДОБАВЛЯЕМ: сохраняем информацию о файле из БД для существующих источников
            filePath: item.getAttribute('data-file-path') || null,
            fileName: item.getAttribute('data-file-name') || null
        };
        
        console.log('🆕 ИНИЦИАЛИЗИРОВАН ИСТОЧНИК:', {
            sourceId: sourceId,
            state: this.downloadSourceStates[sourceId],
            isUrlActive: isUrlActive
        });
    }

    const state = this.downloadSourceStates[sourceId];
    
    // ОБНОВЛЯЕМ UI БЕЗ ПОТЕРИ ДАННЫХ
    this.updateSourceDisplay(sourceId, state, urlInput, fileInput, fileInfo, fileName, urlBtn, fileBtn, typeIndicator);

    // ПЕРЕКЛЮЧЕНИЕ ТОЛЬКО UI - ДАННЫЕ НЕ ТЕРЯЕМ
    urlBtn.addEventListener('click', () => {
        console.log('🔗 ПЕРЕКЛЮЧЕНИЕ НА URL (ТОЛЬКО UI):', sourceId);
        this.updateSourceDisplay(sourceId, state, urlInput, fileInput, fileInfo, fileName, urlBtn, fileBtn, typeIndicator, 'url');
    });

    fileBtn.addEventListener('click', () => {
        console.log('📁 ПЕРЕКЛЮЧЕНИЕ НА ФАЙЛ (ТОЛЬКО UI):', sourceId);
        this.updateSourceDisplay(sourceId, state, urlInput, fileInput, fileInfo, fileName, urlBtn, fileBtn, typeIndicator, 'file');
    });

    // СОХРАНЯЕМ URL ВСЕГДА
    urlInput.addEventListener('input', () => {
        state.url = urlInput.value.trim();
        console.log('💾 URL СОХРАНЕН:', sourceId, state.url);
    });

    // СОХРАНЯЕМ ФАЙЛ ВСЕГДА
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            
            // Валидация формата
            const allowedExtensions = ['.jar', '.zip', '.rar', '.7z'];
            const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            
            if (!allowedExtensions.includes(fileExt)) {
                this.showMessage(`❌ Неверный формат файла. Разрешены: ${allowedExtensions.join(', ')}`, 'error');
                fileInput.value = '';
                return;
            }
            
            // СОХРАНЯЕМ ФАЙЛ
            state.file = file;
            this.downloadSourceFiles[sourceId] = file;
            
            console.log('💾 ФАЙЛ СОХРАНЕН:', {
                sourceId: sourceId,
                fileName: file.name,
                fileSize: file.size
            });
            
            // Обновляем UI
            this.updateSourceDisplay(sourceId, state, urlInput, fileInput, fileInfo, fileName, urlBtn, fileBtn, typeIndicator);
            
        } else {
            // ОЧИЩАЕМ ТОЛЬКО ВЫБРАННЫЙ ФАЙЛ, НО СОХРАНЯЕМ ФАЙЛ ИЗ БД
            console.log('🗑️ ВЫБРАННЫЙ ФАЙЛ УДАЛЕН:', sourceId);
            state.file = null; // Очищаем только новый файл
            delete this.downloadSourceFiles[sourceId];
            this.updateSourceDisplay(sourceId, state, urlInput, fileInput, fileInfo, fileName, urlBtn, fileBtn, typeIndicator);
        }
    });

    console.log('✅ ИНИЦИАЛИЗИРОВАН ИСТОЧНИК:', {
        sourceId: sourceId,
        state: state
    });
};

/**
 * Обновление отображения источника (БЕЗ ПОТЕРИ ДАННЫХ)
 */
UIManager.prototype.updateSourceDisplay = function(sourceId, state, urlInput, fileInput, fileInfo, fileName, urlBtn, fileBtn, typeIndicator, forceType = null) {
    // ОПРЕДЕЛЯЕМ АКТИВНЫЙ ТИП ДЛЯ UI
    let displayType = forceType;
    if (!displayType) {
        // Если есть файл (новый или из БД) - показываем файл, иначе URL
        displayType = (state.file || state.filePath) ? 'file' : 'url';
    }
    
    const isUrlActive = displayType === 'url';
    
    console.log('🔄 ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ:', {
        sourceId: sourceId,
        displayType: displayType,
        hasUrl: !!state.url,
        hasFile: !!state.file,
        hasFilePath: !!state.filePath
    });

    // Обновляем кнопки
    if (urlBtn) urlBtn.classList.toggle('active', isUrlActive);
    if (fileBtn) fileBtn.classList.toggle('active', !isUrlActive);
    
    // Обновляем поля ввода
    if (urlInput) {
        urlInput.style.display = isUrlActive ? 'block' : 'none';
        if (state.url && urlInput.value !== state.url) {
            urlInput.value = state.url;
        }
    }
    
    if (fileInput) {
        fileInput.style.display = isUrlActive ? 'none' : 'block';
    }
    
    // Обновляем индикатор
    if (typeIndicator) {
        typeIndicator.textContent = isUrlActive ? '🔗 URL активен' : '📁 Файл активен';
        typeIndicator.style.color = isUrlActive ? 'var(--success-color)' : 'var(--info-color)';
    }
    
    // ОБНОВЛЯЕМ ИНФОРМАЦИЮ О ФАЙЛЕ (НОВЫЙ ИЛИ ИЗ БД)
    if (fileInfo && fileName) {
        if ((state.file || state.filePath) && !isUrlActive) {
            const displayFileName = state.file ? state.file.name : state.fileName;
            fileName.textContent = displayFileName;
            fileInfo.style.display = 'block';
            console.log('📁 ПОКАЗЫВАЕМ ФАЙЛ В UI:', displayFileName);
        } else {
            fileInfo.style.display = 'none';
        }
    }
};

/**
 * Предзаполнение существующих источников скачивания
 */
UIManager.prototype.prefillDownloadSources = function (fieldId, sources) {
    console.log('🔄 ПРЕДЗАПОЛНЕНИЕ ИСТОЧНИКОВ:', {
        fieldId: fieldId,
        sourcesCount: sources.length,
        sources: sources
    });
    
    const list = document.getElementById(`${fieldId}-list`);
    if (!list) {
        console.error('❌ Контейнер источников не найден:', fieldId);
        return;
    }

    // Очищаем существующие источники
    list.innerHTML = '';
    
    // Очищаем состояния для этого поля
    Object.keys(this.downloadSourceStates).forEach(key => {
        if (key.startsWith('temp_')) {
            delete this.downloadSourceStates[key];
        }
    });
    Object.keys(this.downloadSourceFiles).forEach(key => {
        if (key.startsWith('temp_')) {
            delete this.downloadSourceFiles[key];
        }
    });

    // Добавляем каждый существующий источник
    sources.forEach(source => {
        console.log('📥 ДОБАВЛЯЕМ СУЩЕСТВУЮЩИЙ ИСТОЧНИК:', {
            id: source.id,
            url: source.url,
            fileName: source.fileName,
            versions: source.versions?.length,
            modLoaders: source.modLoaders?.length
        });
        this.addDownloadSourceFromExisting(fieldId, source);
    });

    console.log('✅ ПРЕДЗАПОЛНЕНИЕ ЗАВЕРШЕНО');
};

/**
 * Добавление источника из существующих данных
 */
UIManager.prototype.addDownloadSourceFromExisting = function (fieldId, source) {
    const list = document.getElementById(`${fieldId}-list`);
    if (!list) return;

    const sourceId = source.id;
    
    // СОХРАНЯЕМ ВСЕ ДАННЫЕ ИЗ БД
    this.downloadSourceStates[sourceId] = {
        url: source.url || '',
        file: null, // Файл из БД не восстанавливаем в File объект
        filePath: source.filePath || null,
        fileName: source.fileName || null
    };

    console.log('🎯 СОЗДАНИЕ СУЩЕСТВУЮЩЕГО ИСТОЧНИКА:', {
        sourceId: sourceId,
        state: this.downloadSourceStates[sourceId],
        sourceData: source
    });

    // ОПРЕДЕЛЯЕМ ЧТО ПОКАЗЫВАТЬ: если есть файл в БД - показываем файл, иначе URL
    const hasFileInDb = !!source.filePath;
    const initialDisplay = hasFileInDb ? 'none' : 'block';
    const fileDisplay = hasFileInDb ? 'block' : 'none';
    const isUrlActive = !hasFileInDb;

    const sourceHtml = `
        <div class="download-source-item" data-id="${sourceId}" 
             data-file-path="${source.filePath || ''}" 
             data-file-name="${source.fileName || ''}">
            <!-- Версии -->
            <div class="source-multi-section">
                <div class="section-header">
                    <span class="section-title">🔢 Версии</span>
                    <span class="selection-count">${source.versions?.length || 0}</span>
                </div>
                <div class="section-content">
                    <div class="compact-checkbox-grid">
                        ${this.availableVersions.map(v => `
                            <label class="compact-checkbox version-option ${source.versions?.some(sv => sv.id === v.id) ? 'active' : ''}" 
                                   onclick="uiManager.toggleSourceCheckbox(this, '${sourceId}', 'version')">
                                <input type="checkbox" value="${v.id}" class="source-version-cb" 
                                       ${source.versions?.some(sv => sv.id === v.id) ? 'checked' : ''}>
                                <span class="checkbox-label">${v.title}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="section-actions">
                        <button type="button" class="btn-select-all" onclick="uiManager.selectAllSource('${sourceId}', 'version')">
                            Выбрать все
                        </button>
                        <button type="button" class="btn-deselect-all" onclick="uiManager.deselectAllSource('${sourceId}', 'version')">
                            Очистить
                        </button>
                    </div>
                </div>
            </div>

            <!-- Модлоадеры -->
            <div class="source-multi-section">
                <div class="section-header">
                    <span class="section-title">🛠️ Модлоадеры</span>
                    <span class="selection-count">${source.modLoaders?.length || 0}</span>
                </div>
                <div class="section-content">
                    <div class="compact-checkbox-grid">
                        ${this.availableModLoaders.map(ml => `
                            <label class="compact-checkbox loader-option ${source.modLoaders?.some(sml => sml.id === ml.id) ? 'active' : ''}" 
                                   onclick="uiManager.toggleSourceCheckbox(this, '${sourceId}', 'modloader')">
                                <input type="checkbox" value="${ml.id}" class="source-modloader-cb" 
                                       ${source.modLoaders?.some(sml => sml.id === ml.id) ? 'checked' : ''}>
                                <span class="checkbox-label">${ml.title}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="section-actions">
                        <button type="button" class="btn-select-all" onclick="uiManager.selectAllSource('${sourceId}', 'modloader')">
                            Выбрать все
                        </button>
                        <button type="button" class="btn-deselect-all" onclick="uiManager.deselectAllSource('${sourceId}', 'modloader')">
                            Очистить
                        </button>
                    </div>
                </div>
            </div>

            <!-- Ссылка/файл -->
            <div class="source-input-section">
                <div class="section-header">
                    <span class="section-title">📥 Ссылка И файл</span>
                    <span class="source-type-indicator" style="font-size: 0.8rem; color: ${isUrlActive ? 'var(--success-color)' : 'var(--info-color)'}">
                        ${isUrlActive ? '🔗 Показываем URL' : '📁 Показываем файл'}
                    </span>
                </div>
                <div class="section-content">
                    <div class="source-input-container">
                        <input type="text" class="source-url" placeholder="https://curseforge.com/..." 
                               value="${source.url || ''}" style="display: ${initialDisplay};">
                        <input type="file" class="source-file" style="display: ${fileDisplay};" 
                               accept=".jar,.zip,.rar,.7z,.JAR,.ZIP,.RAR,.7Z">
                        <div class="source-type-toggle">
                            <button type="button" class="btn-type-url ${isUrlActive ? 'active' : ''}" data-type="url" title="Показать ссылку">🔗</button>
                            <button type="button" class="btn-type-file ${!isUrlActive ? 'active' : ''}" data-type="file" title="Показать файл">📁</button>
                            <button type="button" class="btn btn-sm btn-danger" onclick="uiManager.removeDownloadSource('${sourceId}')" title="Удалить источник">🗑️ Удалить</button>
                        </div>
                    </div>
                    ${source.fileName ? `
                        <div class="file-info" style="margin-top: 10px; padding: 8px; background: var(--bg-primary); border-radius: var(--border-radius); display: ${!isUrlActive ? 'block' : 'none'};">
                            <small>📎 Файл в БД: <span class="file-name">${source.fileName}</span></small>
                            <br>
                            <small style="color: var(--warning-color);">⚠️ Для изменения файла выберите новый</small>
                        </div>
                    ` : ''}
                    ${source.url ? `
                        <div class="url-info" style="margin-top: 10px; padding: 8px; background: var(--bg-primary); border-radius: var(--border-radius); display: ${isUrlActive ? 'block' : 'none'};">
                            <small>🔗 Ссылка сохранена: <span class="url-value">${source.url}</span></small>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    list.insertAdjacentHTML('beforeend', sourceHtml);
    
    setTimeout(() => {
        this.initDownloadSourceEvents(sourceId);
    }, 100);
};

/**
 * Удаление источника скачивания с подтверждением
 */
UIManager.prototype.removeDownloadSource = async function (sourceId) {
    const isConfirmed = confirm('❓ Вы уверены, что хотите удалить этот источник скачивания?');
    if (!isConfirmed) return;

    try {
        // ОЧИЩАЕМ ВСЕ ХРАНИЛИЩА (ВАЖНО ДЛЯ ФАЙЛОВ)
        delete this.downloadSourceFiles[sourceId];
        delete this.downloadSourceStates[sourceId];
        
        const item = document.querySelector(`[data-id="${sourceId}"]`);
        const isTemp = item && item.hasAttribute('data-temp');
        
        if (isTemp) {
            if (item) item.remove();
            this.showMessage('✅ Источник скачивания удален', 'success');
            return;
        }

        await api.deleteDownloadSource(sourceId);
        if (item) item.remove();
        this.showMessage('✅ Источник скачивания удален', 'success');

    } catch (error) {
        console.error('❌ Ошибка удаления источника:', error);
        this.showMessage('❌ Ошибка при удалении источника: ' + error.message, 'error');
    }
};

/**
 * Методы для управления чекбоксами в источниках
 */

/**
 * Переключение чекбокса в источнике скачивания
 */
UIManager.prototype.toggleSourceCheckbox = function (label, sourceId, type) {
    const checkbox = label.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    label.classList.toggle('active', checkbox.checked);

    // Обновляем счетчик выбранных
    this.updateSourceSelectionCount(sourceId, type);
};

/**
 * Обновление счетчика выбранных в источнике скачивания
 */
UIManager.prototype.updateSourceSelectionCount = function (sourceId, type) {
    const item = document.querySelector(`[data-id="${sourceId}"]`);
    if (!item) return;

    const selectedCount = item.querySelectorAll(`.source-${type}-cb:checked`).length;
    const countElement = item.querySelector(`.source-multi-section .section-header .selection-count`);

    if (countElement) {
        countElement.textContent = selectedCount;
    }
};

/**
 * Выбрать все в источнике скачивания
 */
UIManager.prototype.selectAllSource = function (sourceId, type) {
    const item = document.querySelector(`[data-id="${sourceId}"]`);
    if (!item) return;

    const checkboxes = item.querySelectorAll(`.source-${type}-cb`);
    const labels = item.querySelectorAll(`.${type}-option`);

    checkboxes.forEach(cb => cb.checked = true);
    labels.forEach(label => label.classList.add('active'));

    this.updateSourceSelectionCount(sourceId, type);
};

/**
 * Очистить выбор в источнике скачивания
 */
UIManager.prototype.deselectAllSource = function (sourceId, type) {
    const item = document.querySelector(`[data-id="${sourceId}"]`);
    if (!item) return;

    const checkboxes = item.querySelectorAll(`.source-${type}-cb`);
    const labels = item.querySelectorAll(`.${type}-option`);

    checkboxes.forEach(cb => cb.checked = false);
    labels.forEach(label => label.classList.remove('active'));

    this.updateSourceSelectionCount(sourceId, type);
};