/**
 * ИНИЦИАЛИЗАЦИЯ ГАЛЕРЕИ ИЗОБРАЖЕНИЙ
 */
UIManager.prototype.initGallery = function (fieldId) {
    const fileInput = document.getElementById(fieldId);
    const previewContainer = document.getElementById(`${fieldId}-preview`);
    
    if (!fileInput || !previewContainer) return;
    
    fileInput.addEventListener('change', (e) => {
        this.handleGallerySelect(fieldId, e.target.files);
    });
};

/**
 * ОБРАБОТКА ВЫБОРА ФАЙЛОВ ДЛЯ ГАЛЕРЕИ
 */
UIManager.prototype.handleGallerySelect = function (fieldId, files) {
    const previewContainer = document.getElementById(`${fieldId}-preview`);
    if (!previewContainer) return;
    
    // Сохраняем выбранные файлы
    if (!this.galleryFiles) this.galleryFiles = {};
    if (!this.galleryFiles[fieldId]) this.galleryFiles[fieldId] = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `gallery_${Date.now()}_${i}`;
        
        // Добавляем файл в коллекцию
        this.galleryFiles[fieldId].push({
            id: fileId,
            file: file,
            isNew: true
        });
        
        // Создаем превью
        this.createGalleryPreview(fieldId, fileId, file);
    }
    
    // Очищаем input для возможности выбора тех же файлов снова
    const fileInput = document.getElementById(fieldId);
    if (fileInput) fileInput.value = '';
};

/**
 * СОЗДАНИЕ ПРЕВЬЮ ДЛЯ ГАЛЕРЕИ
 */
UIManager.prototype.createGalleryPreview = function (fieldId, fileId, file) {
    const previewContainer = document.getElementById(`${fieldId}-preview`);
    if (!previewContainer) return;
    
    // Создаем Object URL для оригинального файла (без сжатия)
    const objectUrl = URL.createObjectURL(file);
    
    const previewItem = document.createElement('div');
    previewItem.className = 'gallery-item';
    previewItem.setAttribute('data-file-id', fileId);
    previewItem.innerHTML = `
        <img src="${objectUrl}" alt="${file.name}" class="gallery-preview-image">
        <button type="button" class="btn-remove-gallery" 
                onclick="uiManager.removeGalleryImage('${fieldId}', '${fileId}')">
            🗑️
        </button>
        <div class="gallery-item-name">${file.name}</div>
    `;
    
    // 🔥 ДОБАВЛЯЕМ КЛИК ДЛЯ ПРОСМОТРА С ОРИГИНАЛЬНЫМ ФАЙЛОМ
    const imgElement = previewItem.querySelector('img');
    imgElement.addEventListener('click', (e) => {
        e.stopPropagation();
        // Используем Object URL для просмотра (оригинальное качество)
        this.showGalleryImage(objectUrl, file.name);
    });
    
    // Сохраняем Object URL для последующей очистки
    if (!this.galleryObjectUrls) this.galleryObjectUrls = {};
    if (!this.galleryObjectUrls[fieldId]) this.galleryObjectUrls[fieldId] = [];
    this.galleryObjectUrls[fieldId].push(objectUrl);
    
    previewContainer.appendChild(previewItem);
};

/**
 * ОЧИСТКА OBJECT URLS ПРИ ЗАКРЫТИИ МОДАЛА
 */
UIManager.prototype.cleanupGalleryObjectUrls = function (fieldId) {
    if (this.galleryObjectUrls && this.galleryObjectUrls[fieldId]) {
        this.galleryObjectUrls[fieldId].forEach(url => {
            URL.revokeObjectURL(url);
        });
        delete this.galleryObjectUrls[fieldId];
    }
};

/**
 * УДАЛЕНИЕ ИЗОБРАЖЕНИЯ ИЗ ГАЛЕРЕИ
 */

UIManager.prototype.removeGalleryImage = function (fieldId, fileId) {
    // Находим элемент для получения Object URL
    const previewItem = document.querySelector(`[data-file-id="${fileId}"]`);
    if (previewItem) {
        const img = previewItem.querySelector('img');
        if (img && img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
        }
    }
    
    // Удаляем из коллекции
    if (this.galleryFiles && this.galleryFiles[fieldId]) {
        this.galleryFiles[fieldId] = this.galleryFiles[fieldId].filter(item => item.id !== fileId);
    }
    
    // Удаляем превью
    if (previewItem) {
        previewItem.remove();
    }
    
    console.log(`🗑️ Удалено изображение из галереи: ${fileId}`);
};

/**
 * ЗАГРУЗКА ИЗОБРАЖЕНИЙ ГАЛЕРЕИ НА СЕРВЕР
 */
UIManager.prototype.uploadGalleryImages = async function (modId, galleryFiles) {
    if (!galleryFiles || galleryFiles.length === 0) {
        return [];
    }
    
    const uploadedUrls = [];
    
    for (const galleryFile of galleryFiles) {
        if (galleryFile.isNew && galleryFile.file) {
            try {
                console.log(`📤 Загружаем изображение галереи: ${galleryFile.file.name}`);
                const imageUrl = await this.uploadGalleryImageToServer(galleryFile.file, modId);
                uploadedUrls.push({
                    id: galleryFile.id,
                    url: imageUrl,
                    fileName: galleryFile.file.name
                });
                console.log(`✅ Изображение галереи загружено: ${imageUrl}`);
            } catch (error) {
                console.error(`❌ Ошибка загрузки изображения галереи: ${error}`);
            }
        }
    }
    
    return uploadedUrls;
};

/**
 * ЗАГРУЗКА ОДНОГО ИЗОБРАЖЕНИЯ ГАЛЕРЕИ НА СЕРВЕР
 */
UIManager.prototype.uploadGalleryImageToServer = async function (file, modId) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("modId", modId);
    
    const uploadUrl = `${api.baseURL}/Upload/gallery-image`;
    console.log("🔼 Отправка изображения галереи на:", uploadUrl);
    
    const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${api.token}`
        },
        body: formData
    });
    
    console.log("📥 Статус ответа галереи:", response.status, response.statusText);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Текст ошибки галереи:", errorText);
        throw new Error(`Ошибка загрузки изображения галереи: ${response.status} ${response.statusText}`);
    }
    
    const relativeUrl = await response.text();
    const fullImageUrl = `${api.baseURL}${relativeUrl}`;
    console.log("✅ Полный URL изображения галереи:", fullImageUrl);
    
    return fullImageUrl;
};

/**
 * СОХРАНЕНИЕ ГАЛЕРЕИ МОДА В БАЗЕ ДАННЫХ
 */
UIManager.prototype.saveModGallery = async function (modId, galleryUrls) {
    try {
        console.log("💾 Сохраняем галерею мода в БД:", { modId, galleryUrls });
        
        await api.saveModGallery(modId, galleryUrls);
        
        console.log("✅ Галерея мода сохранена в БД");
    } catch (error) {
        console.error("❌ Ошибка сохранения галереи мода:", error);
    }
};

/**
 * ИНИЦИАЛИЗАЦИЯ ГАЛЕРЕИ ДЛЯ РЕДАКТИРОВАНИЯ С СУЩЕСТВУЮЩИМИ ИЗОБРАЖЕНИЯМИ
 */
UIManager.prototype.initEditGallery = function (fieldId, existingImages) {
    // Инициализируем обычную галерею
    this.initGallery(fieldId);
    
    // Сохраняем существующие изображения
    if (!this.galleryFiles) this.galleryFiles = {};
    if (!this.galleryFiles[fieldId]) this.galleryFiles[fieldId] = [];
    
    // Добавляем существующие изображения в коллекцию
    if (existingImages && existingImages.length > 0) {
        existingImages.forEach(img => {
            this.galleryFiles[fieldId].push({
                id: img.id,
                imageUrl: img.imageUrl,
                fileName: img.fileName,
                isNew: false,
                isRemoved: false
            });
        });
        
        // 🔥 ДОБАВЛЯЕМ ОБРАБОТЧИКИ КЛИКА ДЛЯ СУЩЕСТВУЮЩИХ ИЗОБРАЖЕНИЙ (ОРИГИНАЛЬНЫЕ URL)
        const previewContainer = document.getElementById(`${fieldId}-preview`);
        if (previewContainer) {
            const existingImgs = previewContainer.querySelectorAll('.gallery-item img');
            existingImgs.forEach((img, index) => {
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Используем оригинальный URL с сервера
                    this.showGalleryImage(img.src, img.alt);
                });
            });
        }
    }
    
    console.log("📷 Инициализирована галерея редактирования:", this.galleryFiles[fieldId]);
};

/**
 * УДАЛЕНИЕ СУЩЕСТВУЮЩЕГО ИЗОБРАЖЕНИЯ ИЗ ГАЛЕРЕИ
 */
UIManager.prototype.removeExistingGalleryImage = function (fieldId, imageId) {
    // Находим изображение в коллекции
    if (this.galleryFiles && this.galleryFiles[fieldId]) {
        const imageIndex = this.galleryFiles[fieldId].findIndex(item => item.id === imageId);
        if (imageIndex !== -1) {
            // 🔥 ПОМЕЧАЕМ КАК УДАЛЕННОЕ, А НЕ УДАЛЯЕМ СРАЗУ
            this.galleryFiles[fieldId][imageIndex].isRemoved = true;
            console.log("🗑️ Помечено для удаления:", imageId);
        }
    }
    
    // Удаляем превью из DOM
    const previewItem = document.querySelector(`[data-image-id="${imageId}"]`);
    if (previewItem) {
        previewItem.remove();
    }
    
    console.log(`🗑️ Изображение помечено для удаления: ${imageId}`);
};

/**
 * ОБРАБОТКА УДАЛЕНИЯ ИЗОБРАЖЕНИЙ ПРИ СОХРАНЕНИИ
 */
UIManager.prototype.processGalleryRemovals = async function (modId, fieldId) {
    if (!this.galleryFiles || !this.galleryFiles[fieldId]) return;
    
    const removedImages = this.galleryFiles[fieldId].filter(item => item.isRemoved && !item.isNew);
    
    console.log("🗑️ Обрабатываем удаление изображений:", removedImages);
    
    for (const removedImage of removedImages) {
        try {
            // Удаляем из БД
            await api.deleteModGallery(removedImage.id);
            console.log("✅ Удалено из БД:", removedImage.id);
            
            // Удаляем файл с сервера
            if (removedImage.imageUrl) {
                const fileName = removedImage.imageUrl.split('/').pop();
                await this.deleteGalleryImageFromServer(fileName);
                console.log("✅ Удален файл:", fileName);
            }
        } catch (error) {
            console.error("❌ Ошибка удаления изображения:", error);
        }
    }
};

/**
 * УДАЛЕНИЕ ФАЙЛА ИЗОБРАЖЕНИЯ ГАЛЕРЕИ С СЕРВЕРА
 */
UIManager.prototype.deleteGalleryImageFromServer = async function (fileName) {
    try {
        const response = await fetch(`${api.baseURL}/Upload/gallery-image/${fileName}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${api.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка удаления файла: ${response.status}`);
        }
        
        console.log("✅ Файл галереи удален с сервера:", fileName);
    } catch (error) {
        console.error("❌ Ошибка удаления файла галереи:", error);
    }
};

/**
 * ПОКАЗ ИЗОБРАЖЕНИЯ В ПОЛНОМ РАЗМЕРЕ
 */
/**
 * ПОКАЗ ИЗОБРАЖЕНИЯ В ПОЛНОМ РАЗМЕРЕ (ИСПРАВЛЕННАЯ ВЕРСИЯ)
 */
UIManager.prototype.showGalleryImage = function (imageUrl, fileName) {
    const modal = document.getElementById("gallery-modal");
    const modalImg = document.getElementById("gallery-modal-image");
    const caption = document.getElementById("gallery-modal-caption");
    
    if (!modal || !modalImg) {
        console.error("❌ Элементы галереи не найдены!");
        return;
    }
    
    console.log("🖼️ Открываем изображение в оригинальном качестве:", imageUrl);
    
    // Показываем loader на время загрузки
    modalImg.style.opacity = "0.5";
    
    modal.style.display = "block";
    
    // 🔥 ОПТИМИЗИРОВАННАЯ ЗАГРУЗКА ИЗОБРАЖЕНИЙ
    if (imageUrl.startsWith('blob:')) {
        // Object URL (новые файлы) - используем как есть (оригинальное качество)
        modalImg.src = imageUrl;
        console.log("📸 Используем Object URL (оригинальное качество)");
    } else {
        // URL с сервера - загружаем оригинал без сжатия
        const cleanUrl = imageUrl.split('?')[0]; // Убираем query параметры которые могут влиять на качество
        modalImg.src = cleanUrl;
        console.log("📸 Используем серверный URL:", cleanUrl);
    }
    
    caption.textContent = fileName || "Изображение галереи";
    
    // 🔥 УЛУЧШЕННАЯ ОБРАБОТКА ЗАГРУЗКИ
    modalImg.onload = () => {
        modalImg.style.opacity = "1";
        console.log("✅ Оригинальное изображение загружено в полном качестве");
        
        // Принудительно применяем высокое качество рендеринга
        modalImg.style.imageRendering = "auto";
    };
    
    modalImg.onerror = () => {
        modalImg.style.opacity = "1";
        console.error("❌ Ошибка загрузки изображения");
        // Пробуем загрузить оригинальный URL если очищенный не сработал
        if (!imageUrl.startsWith('blob:') && imageUrl !== modalImg.src) {
            modalImg.src = imageUrl;
        }
    };
    
    // Собираем все изображения из текущей галереи
    this.collectGalleryImages();
    
    // Находим индекс текущего изображения
    this.currentGalleryIndex = this.findImageIndex(imageUrl);
    
    // Обновляем стрелки
    this.updateNavigationArrows();
    
    // Добавляем обработчик Escape
    this.bindGalleryEvents();
    
    // Блокируем прокрутку
    document.body.style.overflow = "hidden";
};

/**
 * СОБИРАЕМ ВСЕ ИЗОБРАЖЕНИЯ ИЗ ТЕКУЩЕЙ ГАЛЕРЕИ
 */
UIManager.prototype.collectGalleryImages = function () {
    this.currentGallery = [];
    
    // Ищем активную галерею (edit или create)
    const editGallery = document.getElementById("edit-mod-gallery-preview");
    const createGallery = document.getElementById("mod-gallery-preview");
    
    const activeGallery = editGallery || createGallery;
    
    if (activeGallery) {
        const images = activeGallery.querySelectorAll('.gallery-item img');
        images.forEach(img => {
            this.currentGallery.push({
                src: img.src,
                alt: img.alt
            });
        });
    }
    
    console.log("📷 Собрано изображений:", this.currentGallery.length);
};

/**
 * НАХОДИМ ИНДЕКС ИЗОБРАЖЕНИЯ В МАССИВЕ
 */
UIManager.prototype.findImageIndex = function (imageUrl) {
    if (!this.currentGallery || this.currentGallery.length === 0) return 0;
    
    for (let i = 0; i < this.currentGallery.length; i++) {
        if (this.currentGallery[i].src === imageUrl) {
            return i;
        }
    }
    return 0;
};

/**
 * ОБНОВЛЯЕМ СТРЕЛКИ НАВИГАЦИИ
 */
UIManager.prototype.updateNavigationArrows = function () {
    const prevBtn = document.querySelector(".gallery-modal-prev");
    const nextBtn = document.querySelector(".gallery-modal-next");
    
    if (this.currentGallery && this.currentGallery.length > 1) {
        prevBtn.style.display = "block";
        nextBtn.style.display = "block";
    } else {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
    }
};

/**
 * ПРИВЯЗЫВАЕМ СОБЫТИЯ ГАЛЕРЕИ
 */
UIManager.prototype.bindGalleryEvents = function () {
    // Удаляем старые обработчики если есть
    if (this.galleryEscapeHandler) {
        document.removeEventListener("keydown", this.galleryEscapeHandler);
    }
    
    // Создаем новый обработчик
    this.galleryEscapeHandler = (e) => {
        if (e.key === "Escape") {
            this.closeGalleryModal();
        }
        if (e.key === "ArrowLeft") {
            this.navigateGallery('prev');
        }
        if (e.key === "ArrowRight") {
            this.navigateGallery('next');
        }
    };
    
    document.addEventListener("keydown", this.galleryEscapeHandler);
};

/**
 * ПЕРЕКЛЮЧЕНИЕ МЕЖДУ ИЗОБРАЖЕНИЯМИ
 */
UIManager.prototype.navigateGallery = function (direction) {
    if (!this.currentGallery || this.currentGallery.length <= 1) return;
    
    if (direction === 'prev') {
        this.currentGalleryIndex = (this.currentGalleryIndex - 1 + this.currentGallery.length) % this.currentGallery.length;
    } else {
        this.currentGalleryIndex = (this.currentGalleryIndex + 1) % this.currentGallery.length;
    }
    
    const image = this.currentGallery[this.currentGalleryIndex];
    const modalImg = document.getElementById("gallery-modal-image");
    const caption = document.getElementById("gallery-modal-caption");
    
    modalImg.src = image.src;
    caption.textContent = image.alt;
    
    console.log(`🔄 Переключение на изображение ${this.currentGalleryIndex + 1}/${this.currentGallery.length}`);
};

/**
 * ЗАКРЫТИЕ ГАЛЕРЕИ
 */
UIManager.prototype.closeGalleryModal = function () {
    const modal = document.getElementById("gallery-modal");
    if (modal) {
        modal.style.display = "none";
        console.log("✅ Галерея закрыта");
    }
    
    // Удаляем обработчики
    if (this.galleryEscapeHandler) {
        document.removeEventListener("keydown", this.galleryEscapeHandler);
        this.galleryEscapeHandler = null;
    }
    
    // Очищаем данные
    this.currentGallery = null;
    this.currentGalleryIndex = 0;
    
    // Восстанавливаем прокрутку
    document.body.style.overflow = "";
};

/**
 * ОБНОВЛЕНИЕ ПОРЯДКА ОТОБРАЖЕНИЯ ГАЛЕРЕИ
 */
UIManager.prototype.updateGalleryDisplayOrder = async function (modId) {
    try {
        const gallery = await api.getModGallery(modId);
        
        // Сортируем по displayOrder и обновляем если нужно
        const sortedGallery = gallery.sort((a, b) => a.displayOrder - b.displayOrder);
        
        for (let i = 0; i < sortedGallery.length; i++) {
            if (sortedGallery[i].displayOrder !== i) {
                const updateData = {
                    id: sortedGallery[i].id,
                    imageUrl: sortedGallery[i].imageUrl,
                    fileName: sortedGallery[i].fileName,
                    displayOrder: i
                };
                
                await api.updateModGallery(sortedGallery[i].id, updateData);
            }
        }
        
        console.log("🔢 Порядок отображения галереи обновлен");
    } catch (error) {
        console.error("❌ Ошибка обновления порядка галереи:", error);
    }
};

/**
 * ИНИЦИАЛИЗАЦИЯ КАРУСЕЛИ ДЛЯ МОДА
 */
UIManager.prototype.initModCarousel = function (modId, galleryImages) {
    if (!galleryImages || galleryImages.length === 0) {
        return;
    }
    
    const carouselContainer = document.getElementById(`mod-gallery-${modId}`);
    if (!carouselContainer) return;
    
    // Сохраняем данные карусели
    if (!this.carousels) this.carousels = {};
    this.carousels[modId] = {
        images: galleryImages,
        currentIndex: 0,
        interval: null
    };
    
    // Инициализируем карусель
    this.renderCarousel(modId);
    
    // Запускаем автопрокрутку
    this.startCarouselAutoPlay(modId);
    
    // Добавляем обработчики для паузы при наведении
    const container = document.querySelector(`#mod-gallery-${modId} .carousel-container`);
    if (container) {
        container.addEventListener('mouseenter', () => this.stopCarouselAutoPlay(modId));
        container.addEventListener('mouseleave', () => this.startCarouselAutoPlay(modId));
    }
};

/**
 * РЕНДЕР КАРУСЕЛИ
 */
UIManager.prototype.renderCarousel = function (modId) {
    const carousel = this.carousels[modId];
    if (!carousel) return;
    
    const { images, currentIndex } = carousel;
    
    // Обновляем слайды
    this.updateCarouselSlides(modId, images, currentIndex);
    
    // Обновляем точки
    this.updateCarouselDots(modId, images, currentIndex);
};

/**
 * ОБНОВЛЕНИЕ СЛАЙДОВ КАРУСЕЛИ
 */
UIManager.prototype.updateCarouselSlides = function (modId, images, currentIndex) {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    const nextIndex = (currentIndex + 1) % images.length;
    
    // Находим элементы
    const prevSlide = document.querySelector(`#mod-gallery-${modId} .carousel-prev-slide img`);
    const activeSlide = document.querySelector(`#mod-gallery-${modId} .carousel-active-slide img`);
    const nextSlide = document.querySelector(`#mod-gallery-${modId} .carousel-next-slide img`);
    
    if (prevSlide) prevSlide.src = images[prevIndex].imageUrl;
    if (activeSlide) activeSlide.src = images[currentIndex].imageUrl;
    if (nextSlide) nextSlide.src = images[nextIndex].imageUrl;
    
    // Добавляем alt
    if (prevSlide) prevSlide.alt = images[prevIndex].fileName;
    if (activeSlide) activeSlide.alt = images[currentIndex].fileName;
    if (nextSlide) nextSlide.alt = images[nextIndex].fileName;
};

/**
 * ОБНОВЛЕНИЕ ТОЧЕК КАРУСЕЛИ
 */
UIManager.prototype.updateCarouselDots = function (modId, images, currentIndex) {
    const dotsContainer = document.getElementById(`carousel-dots-${modId}`);
    if (!dotsContainer) return;
    
    dotsContainer.innerHTML = '';
    
    images.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = `carousel-dot ${index === currentIndex ? 'active' : ''}`;
        dot.onclick = () => this.goToCarouselSlide(modId, index);
        dotsContainer.appendChild(dot);
    });
};

/**
 * ПЕРЕХОД К КОНКРЕТНОМУ СЛАЙДУ
 */
UIManager.prototype.goToCarouselSlide = function (modId, index) {
    const carousel = this.carousels[modId];
    if (!carousel) return;
    
    carousel.currentIndex = index;
    this.renderCarousel(modId);
    
    // Перезапускаем автопрокрутку
    this.restartCarouselAutoPlay(modId);
};

/**
 * СЛЕДУЮЩИЙ СЛАЙД
 */
UIManager.prototype.carouselNext = function (modId) {
    const carousel = this.carousels[modId];
    if (!carousel) return;
    
    carousel.currentIndex = (carousel.currentIndex + 1) % carousel.images.length;
    this.renderCarousel(modId);
    this.restartCarouselAutoPlay(modId);
};

/**
 * ПРЕДЫДУЩИЙ СЛАЙД
 */
UIManager.prototype.carouselPrev = function (modId) {
    const carousel = this.carousels[modId];
    if (!carousel) return;
    
    carousel.currentIndex = (carousel.currentIndex - 1 + carousel.images.length) % carousel.images.length;
    this.renderCarousel(modId);
    this.restartCarouselAutoPlay(modId);
};

/**
 * ЗАПУСК АВТОПРОКРУТКИ
 */
UIManager.prototype.startCarouselAutoPlay = function (modId) {
    const carousel = this.carousels[modId];
    if (!carousel || carousel.images.length <= 1) return;
    
    // Останавливаем предыдущий интервал
    if (carousel.interval) {
        clearInterval(carousel.interval);
    }
    
    // Запускаем новый интервал (каждые 3 секунды)
    carousel.interval = setInterval(() => {
        this.carouselNext(modId);
    }, 3000);
};

/**
 * ПЕРЕЗАПУСК АВТОПРОКРУТКИ
 */
UIManager.prototype.restartCarouselAutoPlay = function (modId) {
    const carousel = this.carousels[modId];
    if (!carousel) return;
    
    // Останавливаем текущий интервал
    if (carousel.interval) {
        clearInterval(carousel.interval);
    }
    
    // Запускаем заново
    this.startCarouselAutoPlay(modId);
};

/**
 * ОСТАНОВКА АВТОПРОКРУТКИ
 */
UIManager.prototype.stopCarouselAutoPlay = function (modId) {
    const carousel = this.carousels[modId];
    if (!carousel || !carousel.interval) return;
    
    clearInterval(carousel.interval);
    carousel.interval = null;
};

/**
 * ОЧИСТКА КАРУСЕЛИ ПРИ ЗАКРЫТИИ
 */
UIManager.prototype.cleanupCarousel = function (modId) {
    this.stopCarouselAutoPlay(modId);
    
    if (this.carousels && this.carousels[modId]) {
        delete this.carousels[modId];
    }
};