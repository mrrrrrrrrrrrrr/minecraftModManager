/**
 * УНИВЕРСАЛЬНАЯ СИСТЕМА МНОЖЕСТВЕННОГО ВЫБОРА
 * Грид-сетки для выбора версий, модлоадеров, тегов и разработчиков
 */

/**
 * Рендер поля с грид-сеткой для множественного выбора
 */
UIManager.prototype.renderMultiSelectGrid = function (field)
{
    const selectedIds = field.selected ? field.selected.map(item => item.id) : [];
    const optionType = field.optionType || "default";

    return `
        <div class="form-group">
            <div class="section-header">
                <label for="${field.id}">${field.label}</label>
                <span class="selection-count">0</span>
            </div>
            <div class="multi-select-container">
                <div class="compact-checkbox-grid" id="${field.id}-grid">
                    ${field.options.map(option =>
    {
        const isSelected = selectedIds.includes(option.id);
        const displayText = this.escapeHtml(option[field.optionField] || option.title || option.name || option.nickname);
        return `
                            <label class="compact-checkbox ${optionType}-option ${isSelected ? "active" : ""}" 
                                   onclick="uiManager.toggleGridCheckbox(this, '${field.id}')">
                                <input type="checkbox" name="${field.id}" value="${option.id}" 
                                       ${isSelected ? "checked" : ""}>
                                <span class="checkbox-label">${displayText}</span>
                            </label>
                        `;
    }).join("")}
                </div>
                <div class="section-actions">
                    <button type="button" class="btn-select-all" 
                            onclick="uiManager.selectAllInGrid('${field.id}')">
                        Выбрать все
                    </button>
                    <button type="button" class="btn-deselect-all" 
                            onclick="uiManager.deselectAllInGrid('${field.id}')">
                        Очистить
                    </button>
                </div>
                ${field.required ? `
                    <div class="field-error" id="${field.id}-error" style="display: none;">
                        Выберите хотя бы один вариант
                    </div>
                ` : ""}
            </div>
        </div>
    `;
};

/**
 * Переключение чекбокса в грид-сетке
 */
UIManager.prototype.toggleGridCheckbox = function (label, fieldId)
{
    const checkbox = label.querySelector("input[type=\"checkbox\"]");
    checkbox.checked = !checkbox.checked;
    label.classList.toggle("active", checkbox.checked);

    // Обновляем счетчик выбранных
    this.updateSelectionCount(fieldId);
};

/**
 * Обновление счетчика выбранных элементов
 */
UIManager.prototype.updateSelectionCount = function (fieldId)
{
    const container = document.querySelector(`#${fieldId}-grid`);
    if (!container) return;

    const selectedCount = container.querySelectorAll("input[type=\"checkbox\"]:checked").length;
    const countElement = document.querySelector(`label[for="${fieldId}"] .selection-count`) ||
        document.querySelector(`.section-header label[for="${fieldId}"]`)?.parentNode?.querySelector(".selection-count");

    if (countElement)
    {
        countElement.textContent = selectedCount;
    }
};

/**
 * Выбрать все элементы в грид-сетке
 */
UIManager.prototype.selectAllInGrid = function (fieldId)
{
    const container = document.querySelector(`#${fieldId}-grid`);
    if (!container) return;

    const checkboxes = container.querySelectorAll("input[type=\"checkbox\"]");
    const labels = container.querySelectorAll(".compact-checkbox");

    checkboxes.forEach(cb => cb.checked = true);
    labels.forEach(label => label.classList.add("active"));

    this.updateSelectionCount(fieldId);
};

/**
 * Очистить выбор в грид-сетке
 */
UIManager.prototype.deselectAllInGrid = function (fieldId)
{
    const container = document.querySelector(`#${fieldId}-grid`);
    if (!container) return;

    const checkboxes = container.querySelectorAll("input[type=\"checkbox\"]");
    const labels = container.querySelectorAll(".compact-checkbox");

    checkboxes.forEach(cb => cb.checked = false);
    labels.forEach(label => label.classList.remove("active"));

    this.updateSelectionCount(fieldId);
};

/**
 * Предзаполнение грид-сетки выбранными значениями
 */
UIManager.prototype.prefillMultiSelectGrid = function (fieldId, selectedItems)
{
    if (!selectedItems || selectedItems.length === 0) return;

    const selectedIds = selectedItems.map(item => item.id);
    const container = document.querySelector(`#${fieldId}-grid`);
    if (!container) return;

    selectedIds.forEach(id =>
    {
        const checkbox = container.querySelector(`input[value="${id}"]`);
        if (checkbox)
        {
            checkbox.checked = true;
            checkbox.closest(".compact-checkbox")?.classList.add("active");
        }
    });

    this.updateSelectionCount(fieldId);
};

/**
 * Предзаполнение multi-select полей (старый метод для обратной совместимости)
 */
UIManager.prototype.prefillMultiSelect = function (fieldId, selectedItems)
{
    if (!selectedItems || selectedItems.length === 0) return;

    selectedItems.forEach(item =>
    {
        const checkbox = document.querySelector(`input[name="${fieldId}"][value="${item.id}"]`);
        if (checkbox)
        {
            checkbox.checked = true;
        }
    });
};