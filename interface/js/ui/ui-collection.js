UIManager.prototype.currentModsSelection = {};
UIManager.prototype.mainCollectionModal = null;


UIManager.prototype.showAddCollectionModal = function () 
{
    this.currentModsSelection = {};
    this.createModal
    ({
        title: "Создание сборки",
        fields: [{
            type: "text",
            id: "collectionId",
            label: "Название сборки",
            required: true,
            placeholder: "Вертолеха коллектион"
        }, 
        {
            type: "number",
            id: "collectionTimeId",
            label: "Время прохождения",
            required: true,
            placeholder: "0"
        }, 
        {
            type: "single-select-grid",
            id: "collectionVersionId",
            label: "Версия игры",
            required: true,
            options: this.availableVersions,
            optionField: "title",
            optionType: "version"
        },
        {
            type: "single-select-grid",
            id: "collectionModLoaderId",
            label: "Загрузчик модов",
            required: true,
            options: this.availableModLoaders,
            optionField: "title",
            optionType: "modLoader"
        },
        {
            type: "single-select-grid",
            id: "collectionDifficultyId",
            label: "Сложность сборки",
            required: true,
            options: this.availableDifficulties,
            optionField: "title",
            optionType: "difficulty"
        },
        {
            type: "multi-select-grid",
            id: "collectionFocusIds",
            label: "Направление(-я) сборки",
            required: true,
            options: this.availableFocuses,
            optionField: "title",
            optionType: "focus"
        },
        {
            type: "mods-selector",
            id: "collectionModIds",
            label: "Моды в сборке",
            required: true
        }],
        
        
        onSubmit: (data) => this.createCollection(data),
        onOpen: () => {this.mainCollectionModal = document.querySelector('.modal-overlay.active')}
    });
}


UIManager.prototype.openModsSelectionModal = function (fieldId)
{
    this.currentModsSelectionFieldId = fieldId;
    if (this.mainCollectionModal) 
    {
        this.mainCollectionModal.style.display = "none";
    }
    
    
    const modalContainer = document.getElementById("modal-container");
    const modal = document.createElement("div");
    modal.className = "modal-overlay active";
    modal.id = "mods-selection-modal";
    modal.innerHTML = `
        <div class="modal-content mods-selection-modal">
            <div class="modal-header">
                <p>Выбор модов для сборки</p>
                <button class="modal-close" onclick="uiManager.closeModsSelectionModal()">&times;</button>
            </div>
            <div class="mods-selection-modal-content">
                <div class="mods-selection-header">
                    <input type="text" id="mods-search-input" placeholder="поиск модов..." class="search-input">
                    <div class="selection-info">
                        Выбрано: <span id="selected-mods-count">${Object.keys(this.currentModsSelection).length}</span>
                    </div>
                </div>
                <div class="mods-selection-grid" id="mods-selection-grid">
                    <!-- моды будут загружены здесь -->
                </div>
                <div class="mods-selection-actions">
                    <button type="button" class="btn btn-secondary" onclick="uiManager.closeModsSelectionModal()">Отмена</button>
                    <button type="button" class="btn btn-primary" onclick="uiManager.confirmModsSelection()">Применить</button>
                </div>
            </div>
        </div>
    `;
    modalContainer.appendChild(modal);
    
    
    this.renderModsSelectionGrid();
    this.initModsSearch();
}


UIManager.prototype.closeModsSelectionModal = function ()
{
    const modal = document.getElementById("mods-selection-modal");
    if (modal)
    {
        modal.remove();
    }
    if (this.mainCollectionModal)
    {
        this.mainCollectionModal.style.display = "flex";
    }
}


UIManager.prototype.confirmModsSelection = function ()
{
    this.updateModsSelectionPreview(this.currentModsSelectionFieldId);
    this.closeModsSelectionModal();
}


UIManager.prototype.updateModsSelectionPreview = function (fieldId)
{
    const preview = document.getElementById(`${fieldId}-preview`);
    if (!preview)
    {
        return;
    }
    const selectedMods = Object.values(this.currentModsSelection);
    
    
    if (selectedMods.length <= 0)
    {
        preview.innerHTML = '<div class="no-mods-selected"> Моды не выбраны </div>';
    }
    else
    {
        preview.innerHTML = selectedMods.map(mod => `
            <div class="selected-mod-item" data-mod-id="${mod.id}">
                <span>${this.escapeHtml(mod.title)}</span>
                <button type="button" class="btn-remove-mod" onclick="uiManager.removeModFromSelection('${fieldId}', '${mod.id}')">×</button>
            </div>
        `).join('');
    }
}


UIManager.prototype.createCollection = async function (collectionData)
{
    const selectedModIds = Object.keys(this.currentModsSelection);
    const apiData = 
        {
            name: collectionData["collectionId"],
            timeToComplete: parseInt(collectionData["collectionTimeId"]) || 0,
            versionId: collectionData["collectionVersionId"][0],
            modLoaderId: collectionData["collectionModLoaderId"][0],
            difficultyId: collectionData["collectionDifficultyId"][0],
            focusesIds: collectionData["collectionFocusIds"] || [],
            modsIds: selectedModIds,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    
    
    await api.createCollection(apiData);
    this.closeModal();
    await this.loadAllData();
}


UIManager.prototype.renderModsSelectorField = function (field)
{
    const selectedMods = field.selected || [];

    // сохраняем выбранные моды в хранилище
    selectedMods.forEach(mod => 
    {
        this.currentModsSelection[mod.id] = mod;
    });

    return `
        <div class="form-group">
            <label for="${field.id}">${field.label}</label>
            <div class="mods-selector-container">
                <div class="selected-mods-preview" id="${field.id}-preview">
                    ${Object.keys(this.currentModsSelection).length > 0 ? Object.values(this.currentModsSelection).map(mod => `
                            <div class="selected-mod-item" data-mod-id="${mod.id}">
                                <span>${this.escapeHtml(mod.title)}</span>
                                <button type="button" class="btn-remove-mod" 
                                onclick="uiManager.removeModFromSelection('${field.id}', '${mod.id}')">×</button>
                            </div>
                        `).join('') :
        '<div class="no-mods-selected">Моды не выбраны</div>'
    }
                </div>
                <button type="button" class="btn btn-secondary" onclick="uiManager.openModsSelectionModal('${field.id}')">
                    Выбрать моды
                </button>
                ${field.required ? `
                    <div class="field-error" id="${field.id}-error" style="display: none;">
                        Выберите хотя бы один мод
                    </div>
                ` : ""}
            </div>
        </div>
    `;
}


UIManager.prototype.renderModsSelectionGrid = function () 
{
    const grid = document.getElementById("mods-selection-grid");
    if (!grid) return;

    if (this.mods.length === 0) 
    {
        grid.innerHTML = '<div class="no-mods-available">Моды не найдены</div>';
        return;
    }

    grid.innerHTML = this.mods.map(mod => 
    {
        const isSelected = this.currentModsSelection[mod.id];

        return `
            <div class="mod-selection-item ${isSelected ? 'selected' : ''}" 
                 data-mod-id="${mod.id}"
                 onclick="uiManager.toggleModSelection('${mod.id}')">
                <div class="mod-selection-info">
                    <div class="mod-selection-title">${this.escapeHtml(mod.title)}</div>
                    <div class="mod-selection-meta">
                        ${mod.developers && mod.developers.length > 0 ?
            `<span class="mod-selection-developer">от ${this.escapeHtml(mod.developers[0].nickname)}</span>` :
            ''
        }
                        <span class="mod-selection-size">${mod.size || 0} MB</span>
                        <span class="mod-selection-type">${mod.isClientside ? '🎮 клиент' : '🖥️ сервер'}</span>
                    </div>
                    ${mod.description ? `
                        <div class="mod-selection-description">${this.escapeHtml(mod.description.substring(0, 100))}${mod.description.length > 100 ? '...' : ''}</div>
                    ` : ''}
                </div>
                <div class="mod-selection-indicator">
                    ${isSelected ? '✓' : ''}
                </div>
            </div>
        `;
    }).join('');
}


UIManager.prototype.toggleModSelection = function (modId)
{
    const modItem = document.querySelector(`.mod-selection-item[data-mod-id="${modId}"]`);
    if (!modItem) return;

    if (this.currentModsSelection[modId]) 
    {
        delete this.currentModsSelection[modId];
        modItem.classList.remove('selected');
    } 
    else
    {
        const mod = this.mods.find(m => m.id === modId);
        if (mod) 
        {
            this.currentModsSelection[modId] = {
                id: mod.id,
                title: mod.title
            };
            modItem.classList.add('selected');
        }
    }
    
    
    this.updateSelectedModsCount();
}


UIManager.prototype.updateSelectedModsCount = function ()
{
    const selectedCount = Object.keys(this.currentModsSelection).length;
    const countElement = document.getElementById('selected-mods-count');
    if (countElement)
    {
        countElement.textContent = `${selectedCount}`;
    }
}


UIManager.prototype.initModsSearch = function ()
{
    const searchInput = document.getElementById("mods-search-input");
    if (!searchInput)
    {
        return;
    }
    
    
    searchInput.addEventListener('input', (e) => 
    {
        const searchTerm = e.target.value.toLowerCase().trim();
        this.filterModsSelection(searchTerm);
    })
}


UIManager.prototype.filterModsSelection = function (searchTerm)
{
    const modItems = document.querySelectorAll('.mod-selection-item');
    modItems.forEach(item => 
    {
        const title = item.querySelector('.mod-selection-title').textContent.toLowerCase();
        const developer = item.querySelector('.mod-selection-developer')?.textContent.toLowerCase() || "";
        const description = item.querySelector('.mod-selection-description')?.textContent.toLowerCase() || "";
        const matchesSearch = !searchTerm 
            || title.includes(searchTerm) 
            || developer.includes(searchTerm) 
            || description.includes(searchTerm);
        item.style.display = matchesSearch ? 'flex' : 'none';
    })
}


UIManager.prototype.removeModFromSelection = function (fieldId, modId)
{
    delete this.currentModsSelection[modId];
    this.updateModsSelectionPreview(fieldId);
}


UIManager.prototype.editCollection = async function (collectionId)
{
    const collection = this.collections.find(c => c.id === collectionId);
    this.currentModsSelection = this.currentModsSelection || {};
    if (collection.mods && collection.mods.length > 0)
    {
        collection.mods.forEach(mod => 
        {
            this.currentModsSelection[mod.id] = 
            {
                id: mod.id,
                title: mod.title
            };
        })
    }
    
    
    this.createModal
    ({
        title: "Редактирование сборки",
        fields: 
        [{
            type: "text",
            id: "edit-collection-name",
            label: "Название сборки",
            required: true,
            placeholder: "введите название сборки",
            value: collection.name
        },
        {
            type: "number",
            id: "edit-collection-time",
            label: "Время прохождения (часы)",
            required: true,
            placeholder: "0",
            value: collection.timeToComplete
        },
        {
            type: "single-select-grid",
            id: "edit-collection-version",
            label: "Версия minecraft",
            required: true,
            options: this.availableVersions,
            optionField: "title",
            optionType: "version",
            selected: [collection.version]
        },
        {
            type: "single-select-grid",
            id: "edit-collection-modloader",
            label: "Модлоадер",
            required: true,
            options: this.availableModLoaders,
            optionField: "title",
            optionType: "loader",
            selected: [collection.modloader]
        },
        {
            type: "single-select-grid",
            id: "edit-collection-difficulty",
            label: "Сложность",
            required: true,
            options: this.availableDifficulties,
            optionField: "title",
            optionType: "difficulty",
            selected: [collection.difficulty]
        },
        {
            type: "multi-select-grid",
            id: "edit-collection-focuses",
            label: "Фокусы/Направления",
            required: false,
            options: this.availableFocuses,
            optionField: "name",
            optionType: "focus",
            selected: collection.focuses || []
        },
        {
            type: "mods-selector",
            id: "edit-collection-mods",
            label: "Моды в сборке",
            required: true,
            selected: collection.mods || []
        }],
        
        
        onSubmit: (data) => this.updateCollection(collectionId, data),
        onOpen: () =>
        {
            this.mainCollectionModal = document.querySelector(".main-collection.active");
            this.updateModsSelectionPreview("edit-collection-mods");
            this.prefillMultiSelectGrid("edit-collection-version", [collection.version]);
            this.prefillMultiSelectGrid("edit-collection-modloader", [collection.modloader]);
            this.prefillMultiSelectGrid("edit-collection-difficulty", [collection.difficulty]);
            this.prefillMultiSelectGrid("edit-collection-focuses", collection.focuses || []);
        }
    })
}


UIManager.prototype.renderSingleSelectGrid = function (field)
{
    const selectedId = field.selected ? field.selected[0]?.id : null;
    const optionType = field.optionType || "default";

    
    return `
        <div class="form-group">
            <div class="section-header">
                <label for="${field.id}">${field.label}</label>
                <!-- убрали счетчик для одиночного выбора -->
            </div>
            <div class="multi-select-container">
                <div class="compact-checkbox-grid" id="${field.id}-grid">
                    ${field.options.map(option => {
        const isSelected = selectedId === option.id;
        const displayText = this.escapeHtml(option[field.optionField] || option.title || option.name || option.nickname);
        return `
                            <label class="compact-checkbox ${optionType}-option ${isSelected ? "active" : ""}" 
                                   onclick="uiManager.toggleSingleGridCheckbox(this, '${field.id}')">
                                <input type="radio" name="${field.id}" value="${option.id}" 
                                       ${isSelected ? "checked" : ""}>
                                <span class="checkbox-label">${displayText}</span>
                            </label>
                        `;
    }).join("")}
                </div>
                ${field.required ? `
                    <div class="field-error" id="${field.id}-error" style="display: none;">
                        Выберите вариант
                    </div>
                ` : ""}
            </div>
        </div>
    `;
}


UIManager.prototype.toggleSingleGridCheckbox = function (label, fieldId)
{
    const container = document.querySelector(`#${fieldId}-grid`);
    if (!container)
    {
        return;
    }
    
    
    const allLabels = container.querySelectorAll(".compact-checkbox");
    const allInputs = container.querySelectorAll("input[type=\"radio\"]");
    allLabels.forEach(label => label.classList.remove("active"));
    allInputs.forEach(input => input.checked = false);
    
    
    const checkbox = label.querySelector("input[type=\"radio\"]");
    checkbox.checked = true;
    label.classList.add("active");
}


UIManager.prototype.updateCollection = async function (collectionData, collectionId)
{
    const selectedModIds = Object.keys(this.currentModsSelection);
    const apiData = 
    {
        name: collectionData["edit-collection-name"],
        timeToComplete: parseInt(collectionData["edit-collection-time"]) || 0,
        versionId: collectionData["edit-collection-version"][0],
        modLoaderId: collectionData["edit-collection-modloader"][0],
        difficultyId: collectionData["edit-collection-difficulty"][0],
        focusesIds: collectionData["edit-collection-focuses"] || [],
        modsIds: selectedModIds,
        updatedAt: new Date().toISOString()
    };
    
    
    await api.updateCollection(collectionId, apiData);
    this.closeModal();
    await this.loadAllData();
}


UIManager.prototype.deleteCollection = async function (collectionId)
{
    const isConfirmed = confirm('Вы уверены что хотите удалить сборку');
    if (!isConfirmed)
    {
        return;
    }
    
    
    await api.deleteCollection(collectionId);
    await this.loadAllData();
}