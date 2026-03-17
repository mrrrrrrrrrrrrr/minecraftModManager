// services/ModParser.js

/**
 * Парсер для сайта ru-minecraft.ru
 * Извлекает данные мода из HTML страницы
 */

class RuMinecraftParser {
  constructor() {
    this.warnings = [];
    this.parsedData = {
      title: '',
      description: '',
      versions: [],
      modLoaders: [],
      category: '',
      author: '',
      downloadUrls: [],
      rawHtml: ''
    };
  }

  /**
   * Основной метод для парсинга
   * @param {string} url - URL страницы мода
   * @param {string} html - HTML контент страницы
   * @returns {Object} - Распарсенные данные и предупреждения
   */
  parse(url, html) {
    this.warnings = [];
    this.parsedData = {
      title: '',
      description: '',
      versions: [],
      modLoaders: [],
      category: '',
      author: '',
      downloadUrls: [],
      rawHtml: html.substring(0, 500) // только для отладки
    };

    try {
      // Создаем DOM из HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Парсим все поля
      this.parseTitle(doc);
      this.parseDescription(doc);
      this.parseVersions(doc);
      this.parseModLoaders(doc);
      this.parseCategory(doc, url);
      this.parseAuthor(doc);
      this.parseDownloadUrls(doc);

      return {
        success: true,
        data: this.parsedData,
        warnings: this.warnings
      };

    } catch (error) {
      console.error('Критическая ошибка парсинга:', error);
      return {
        success: false,
        error: error.message,
        warnings: this.warnings
      };
    }
  }

  /**
   * Парсит заголовок мода
   */
  parseTitle(doc) {
    try {
      // Ищем h1 - обычно это заголовок
      const h1 = doc.querySelector('h1');
      if (!h1) {
        this.warnings.push('Заголовок (h1) не найден');
        return;
      }

      let fullTitle = h1.textContent.trim();
      
      // Убираем версии в квадратных скобках из заголовка
      // Например: "Saddlebag - сумки для твоего волка [1.21.11] [1.21.8]" -> "Saddlebag - сумки для твоего волка"
      const cleanTitle = fullTitle.replace(/\s*\[[^\]]+\]\s*/g, '').trim();
      
      this.parsedData.title = cleanTitle;
      
      // Заодно пытаемся вытащить версии из заголовка
      const versionMatches = fullTitle.match(/\[([\d.]+)\]/g);
      if (versionMatches) {
        const titleVersions = versionMatches.map(v => v.replace(/[\[\]]/g, ''));
        this.parsedData.versions = [...new Set([...this.parsedData.versions, ...titleVersions])];
      }

    } catch (error) {
      this.warnings.push(`Ошибка парсинга заголовка: ${error.message}`);
    }
  }

  /**
   * Парсит описание мода
   */
  parseDescription(doc) {
    try {
      // Ищем описание - обычно это текст после заголовка h2 с описанием
      // или первый параграф после заголовка
      const possibleDescriptions = [];
      
      // Ищем h2 с текстом про описание
      const headings = doc.querySelectorAll('h2');
      for (const h2 of headings) {
        if (h2.textContent.toLowerCase().includes('описан')) {
          // Берем следующий параграф после этого h2
          let nextElem = h2.nextElementSibling;
          while (nextElem) {
            if (nextElem.tagName === 'P') {
              possibleDescriptions.push(nextElem.textContent.trim());
              break;
            }
            nextElem = nextElem.nextElementSibling;
          }
          break;
        }
      }

      // Если не нашли через h2, берем первый большой параграф
      if (possibleDescriptions.length === 0) {
        const paragraphs = doc.querySelectorAll('p');
        for (const p of paragraphs) {
          const text = p.textContent.trim();
          if (text.length > 100 && !text.includes('Установи') && !text.includes('Скачать')) {
            possibleDescriptions.push(text);
            break;
          }
        }
      }

      // Если нашли описание
      if (possibleDescriptions.length > 0) {
        this.parsedData.description = possibleDescriptions[0];
      } else {
        this.warnings.push('Не удалось найти описание мода');
      }

    } catch (error) {
      this.warnings.push(`Ошибка парсинга описания: ${error.message}`);
    }
  }

  /**
   * Парсит версии Minecraft
   */
  parseVersions(doc) {
    try {
      const versions = new Set();
      
      // 1. Ищем в заголовке (уже сделано в parseTitle)
      // 2. Ищем в тексте ссылок на скачивание или кнопках фильтров
      const versionElements = doc.querySelectorAll('[class*="version"], [class*="ver-"], .version-tag, a[href*="version"]');
      
      versionElements.forEach(el => {
        const text = el.textContent.trim();
        // Ищем паттерны версий: 1.21, 1.21.1, 1.20.1 и т.д.
        const matches = text.match(/\b\d+\.\d+(?:\.\d+)?\b/g);
        if (matches) {
          matches.forEach(v => versions.add(v));
        }
      });

      // 3. Ищем в блоке фильтров (часто там есть кнопки с версиями)
      const filterBlocks = doc.querySelectorAll('.filters, .filter-block, [class*="filter"]');
      filterBlocks.forEach(block => {
        const buttons = block.querySelectorAll('button, a, .filter-item');
        buttons.forEach(btn => {
          const text = btn.textContent.trim();
          const matches = text.match(/\b\d+\.\d+(?:\.\d+)?\b/g);
          if (matches) {
            matches.forEach(v => versions.add(v));
          }
        });
      });

      // Сохраняем уникальные версии
      this.parsedData.versions = [...new Set([...this.parsedData.versions, ...versions])];
      
      if (this.parsedData.versions.length === 0) {
        this.warnings.push('Не удалось найти версии Minecraft');
      }

    } catch (error) {
      this.warnings.push(`Ошибка парсинга версий: ${error.message}`);
    }
  }

  /**
   * Парсит загрузчики модов
   */
  parseModLoaders(doc) {
    try {
      const loaders = new Set();
      const loaderKeywords = {
        'forge': 'Forge',
        'fabric': 'Fabric',
        'neoforge': 'NeoForge',
        'quilt': 'Quilt',
        'rift': 'Rift'
      };

      // Ищем в тексте страницы
      const bodyText = doc.body.textContent.toLowerCase();
      
      Object.entries(loaderKeywords).forEach(([keyword, name]) => {
        if (bodyText.includes(keyword)) {
          loaders.add(name);
        }
      });

      // Ищем в элементах с классами
      const loaderElements = doc.querySelectorAll('[class*="loader"], [class*="modloader"], .forge, .fabric, .neoforge');
      loaderElements.forEach(el => {
        const text = el.textContent.toLowerCase();
        Object.entries(loaderKeywords).forEach(([keyword, name]) => {
          if (text.includes(keyword)) {
            loaders.add(name);
          }
        });
      });

      this.parsedData.modLoaders = [...loaders];
      
      if (this.parsedData.modLoaders.length === 0) {
        this.warnings.push('Не удалось определить загрузчики модов (они редко указываются на этом сайте)');
      }

    } catch (error) {
      this.warnings.push(`Ошибка парсинга загрузчиков: ${error.message}`);
    }
  }

  /**
   * Парсит категорию/теги
   */
  parseCategory(doc, url) {
    try {
      // Пробуем из URL
      const urlMatch = url.match(/\/([^\/]+)\/\d+-/);
      if (urlMatch && urlMatch[1]) {
        const categoryFromUrl = urlMatch[1].replace(/-/g, ' ');
        this.parsedData.category = this.capitalizeWords(categoryFromUrl);
        return;
      }

      // Пробуем из "хлебных крошек"
      const breadcrumbs = doc.querySelector('.breadcrumbs, [class*="breadcrumb"]');
      if (breadcrumbs) {
        const links = breadcrumbs.querySelectorAll('a');
        if (links.length >= 2) {
          // Берем предпоследний элемент (обычно это категория)
          const categoryElem = links[links.length - 2];
          this.parsedData.category = categoryElem.textContent.trim();
          return;
        }
      }

      this.warnings.push('Не удалось определить категорию мода');

    } catch (error) {
      this.warnings.push(`Ошибка парсинга категории: ${error.message}`);
    }
  }

  /**
   * Парсит автора
   */
  parseAuthor(doc) {
    try {
      // Ищем информацию об авторе
      const authorSelectors = [
        '.author',
        '[class*="author"]',
        '.user',
        '[class*="user"]',
        '.profile-name',
        '.username'
      ];

      for (const selector of authorSelectors) {
        const authorElem = doc.querySelector(selector);
        if (authorElem) {
          const authorText = authorElem.textContent.trim();
          if (authorText && authorText.length < 50) { // Исключаем длинные тексты
            this.parsedData.author = authorText;
            return;
          }
        }
      }

      // Если не нашли через селекторы, ищем в метаданных
      const metaAuthor = doc.querySelector('meta[name="author"]');
      if (metaAuthor) {
        this.parsedData.author = metaAuthor.getAttribute('content');
        return;
      }

      this.warnings.push('Не удалось найти автора мода');

    } catch (error) {
      this.warnings.push(`Ошибка парсинга автора: ${error.message}`);
    }
  }

  /**
   * Парсит ссылки на скачивание
   */
  parseDownloadUrls(doc) {
    try {
      const downloadUrls = [];
      
      // Ищем ссылки, которые ведут на файлы
      const links = doc.querySelectorAll('a[href$=".jar"], a[href$=".zip"], a[href$=".rar"], a[href*="download"]');
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#')) {
          // Пытаемся определить версию и загрузчик из текста ссылки
          const linkText = link.textContent.toLowerCase();
          let version = null;
          let loader = null;

          // Ищем версию в тексте ссылки
          const versionMatch = linkText.match(/\b\d+\.\d+(?:\.\d+)?\b/);
          if (versionMatch) {
            version = versionMatch[0];
          }

          // Ищем загрузчик
          if (linkText.includes('forge')) loader = 'Forge';
          else if (linkText.includes('fabric')) loader = 'Fabric';
          else if (linkText.includes('neoforge')) loader = 'NeoForge';

          downloadUrls.push({
            url: href.startsWith('http') ? href : `https://ru-minecraft.ru${href}`,
            text: link.textContent.trim(),
            version,
            loader
          });
        }
      });

      if (downloadUrls.length > 0) {
        this.parsedData.downloadUrls = downloadUrls;
      } else {
        this.warnings.push('Ссылки на скачивание не найдены (обычно их нет на страницах этого сайта)');
      }

    } catch (error) {
      this.warnings.push(`Ошибка парсинга ссылок: ${error.message}`);
    }
  }

  /**
   * Вспомогательная функция для капитализации слов
   */
  capitalizeWords(str) {
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Создаем и экспортируем экземпляр парсера
const parser = new RuMinecraftParser();

/**
 * Основная функция для парсинга мода с ru-minecraft.ru
 * @param {string} url - URL страницы мода
 * @returns {Promise<Object>} - Распарсенные данные
 */
export async function parseRuMinecraft(url) {
  try {
    // ВАЖНО: Здесь нужен прокси для обхода CORS
    // Вариант 1: Через свой бэкенд
    const proxyUrl = `http://localhost:5126/api/proxy?url=${encodeURIComponent(url)}`;
    
    // Вариант 2: Использовать публичный CORS прокси (только для разработки!)
    // const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    console.log(`🔄 Загружаем страницу: ${url}`);
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Парсим HTML
    const result = parser.parse(url, html);
    
    if (result.success) {
      console.log('✅ Парсинг успешен:', result.data);
    } else {
      console.error('❌ Ошибка парсинга:', result.error);
    }
    
    return result;

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    return {
      success: false,
      error: error.message,
      data: null,
      warnings: [`Ошибка загрузки страницы: ${error.message}`]
    };
  }
}

// Экспортируем также класс для расширения
export default RuMinecraftParser;