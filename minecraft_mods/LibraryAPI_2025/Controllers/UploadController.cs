using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DAL.Interfaces;
using DTO.ModVersion;
using DTO.ModLoader;
using System.Net;
using Microsoft.AspNetCore.Hosting;
using BLL.Services;

namespace LibraryAPI_2025.Controllers;

[ApiController]
[Route("/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly IRepository<ModVersionDto, CreateModVersionDto, UpdateModVersionDto> _versionRepository;
    private readonly IRepository<ModLoaderDto, CreateModLoaderDto, UpdateModLoaderDto> _modLoaderRepository;

    public UploadController(
        IWebHostEnvironment environment,
        IRepository<ModVersionDto, CreateModVersionDto, UpdateModVersionDto> versionRepository,
        IRepository<ModLoaderDto, CreateModLoaderDto, UpdateModLoaderDto> modLoaderRepository)
    {
        _environment = environment;
        _versionRepository = versionRepository;
        _modLoaderRepository = modLoaderRepository;
    }

    [Authorize]
    [HttpPost("image")]
    public async Task<ActionResult<string>> UploadImage(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest("Файл не выбран");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
                return BadRequest("Допустимы только JPG, PNG, GIF, WebP");

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest("Максимальный размер файла - 5MB");

            var fileName = $"{Guid.NewGuid()}{extension}";
            var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads");

            if (!Directory.Exists(uploadsPath))
                Directory.CreateDirectory(uploadsPath);

            var fullPath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/uploads/{fileName}";
            return Ok(imageUrl);

        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Ошибка загрузки: {ex.Message}");
        }
    }

    [Authorize]
    [HttpPost("mod-file")]
    public async Task<ActionResult<object>> UploadModFile(
        IFormFile file,
        [FromForm] string versionIds,
        [FromForm] string modLoaderIds,
        [FromForm] string modId)
    {
        try
        {
            Console.WriteLine("=== 🚀 НАЧАЛО ЗАГРУЗКИ ФАЙЛА ===");
            Console.WriteLine($"📥 Получен файл: {file?.FileName}");
            Console.WriteLine($"📊 Размер файла: {file?.Length} bytes");
            Console.WriteLine($"🔢 VersionIds: {versionIds}");
            Console.WriteLine($"🛠️ ModLoaderIds: {modLoaderIds}");
            Console.WriteLine($"🆔 ModId: {modId}");

            if (file == null || file.Length == 0)
            {
                Console.WriteLine("❌ Файл пустой");
                return BadRequest("Файл мода не выбран");
            }

            // Проверка расширения
            var allowedExtensions = new[] { ".jar", ".zip", ".rar", ".7z" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            Console.WriteLine($"📎 Расширение файла: {extension}");

            if (!allowedExtensions.Contains(extension))
            {
                Console.WriteLine($"❌ Неподдерживаемое расширение: {extension}");
                return BadRequest("Допустимы только JAR, ZIP, RAR, 7Z файлы");
            }

            // Проверка размера
            if (file.Length > 200 * 1024 * 1024)
            {
                Console.WriteLine($"❌ Файл слишком большой: {file.Length} bytes");
                return BadRequest("Максимальный размер файла - 200MB, мяу");
            }

            // Парсим JSON
            List<Guid> versionIdList = new();
            List<Guid> loaderIdList = new();

            try
            {
                versionIdList = System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(versionIds) ?? new List<Guid>();
                loaderIdList = System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(modLoaderIds) ?? new List<Guid>();
                Console.WriteLine($"✅ VersionIds распарсено: {versionIdList.Count}");
                Console.WriteLine($"✅ ModLoaderIds распарсено: {loaderIdList.Count}");
            }
            catch (Exception jsonEx)
            {
                Console.WriteLine($"❌ Ошибка парсинга JSON: {jsonEx.Message}");
                return BadRequest("Ошибка в формате versionIds или modLoaderIds");
            }

            if (!versionIdList.Any() || !loaderIdList.Any())
            {
                Console.WriteLine("❌ Нет versionIds или modLoaderIds");
                return BadRequest("Необходимо указать версии и загрузчики");
            }

            // Получаем названия
            var versions = await GetVersionTitles(versionIdList);
            var loaders = await GetLoaderTitles(loaderIdList);
            Console.WriteLine($"🏷️ Версии: {string.Join(", ", versions)}");
            Console.WriteLine($"🛠️ Загрузчики: {string.Join(", ", loaders)}");

            // Генерация имени файла
            var fileName = GenerateFileName(versions, loaders, extension, modId);
            Console.WriteLine($"📛 Сгенерированное имя файла: {fileName}");

            var modsPath = Path.Combine(_environment.WebRootPath, "mods");
            Console.WriteLine($"📁 Путь к папке mods: {modsPath}");

            if (!Directory.Exists(modsPath))
            {
                Console.WriteLine($"📁 Создаем папку: {modsPath}");
                Directory.CreateDirectory(modsPath);
            }

            var fullPath = Path.Combine(modsPath, fileName);
            Console.WriteLine($"💾 Полный путь к файлу: {fullPath}");

            // Сохраняем файл
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            Console.WriteLine($"✅ Файл успешно сохранен: {fullPath}");
            Console.WriteLine($"📏 Размер сохраненного файла: {new FileInfo(fullPath).Length} bytes");

            var baseUrl = GetBaseUrl();
            var result = new
            {
                fileName = fileName,
                originalFileName = file.FileName,
                filePath = $"/mods/{fileName}",
                fileSize = file.Length,
                downloadUrl = $"{baseUrl}/mods/{WebUtility.UrlEncode(fileName)}",
                versionIds = versionIdList,
                modLoaderIds = loaderIdList,
                versions = versions,
                modLoaders = loaders,
                modId = modId
            };

            Console.WriteLine("=== ✅ ФАЙЛ УСПЕШНО ЗАГРУЖЕН ===");
            Console.WriteLine($"📤 Результат: {System.Text.Json.JsonSerializer.Serialize(result)}");

            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"💥 КРИТИЧЕСКАЯ ОШИБКА: {ex}");
            Console.WriteLine($"💥 StackTrace: {ex.StackTrace}");
            return StatusCode(500, $"Ошибка загрузки файла мода: {ex.Message}");
        }
    }

    [Authorize]
    [HttpPut("mods/rename")]
    public async Task<ActionResult<object>> RenameModFile(
        [FromForm] string oldFileName,
        [FromForm] string versionIds,
        [FromForm] string modLoaderIds,
        [FromForm] string modId)
    {
        try
        {
            Console.WriteLine($"🔄 ПЕРЕИМЕНОВАНИЕ ФАЙЛА: {oldFileName}");

            // Проверяем существование старого файла
            var modsPath = Path.Combine(_environment.WebRootPath, "mods");
            var oldFilePath = Path.Combine(modsPath, oldFileName);

            if (!System.IO.File.Exists(oldFilePath))
            {
                return NotFound($"Файл {oldFileName} не найден");
            }

            // Парсим JSON
            List<Guid> versionIdList;
            List<Guid> loaderIdList;

            try
            {
                versionIdList = System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(versionIds) ?? new List<Guid>();
                loaderIdList = System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(modLoaderIds) ?? new List<Guid>();
            }
            catch (Exception jsonEx)
            {
                return BadRequest("Ошибка в формате versionIds или modLoaderIds");
            }

            if (!versionIdList.Any() || !loaderIdList.Any())
            {
                return BadRequest("Необходимо указать версии и загрузчики");
            }

            // 🔥 ПОЛУЧАЕМ НАЗВАНИЯ ВЕРСИЙ И ЗАГРУЗЧИКОВ
            var versions = new List<string>();
            foreach (var versionId in versionIdList)
            {
                try
                {
                    var version = await _versionRepository.GetById(versionId);
                    versions.Add(version?.Title ?? versionId.ToString().Substring(0, 8));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Ошибка получения версии {versionId}: {ex.Message}");
                    versions.Add(versionId.ToString().Substring(0, 8));
                }
            }

            var loaders = new List<string>();
            foreach (var loaderId in loaderIdList)
            {
                try
                {
                    var loader = await _modLoaderRepository.GetById(loaderId);
                    loaders.Add(loader.Title);
                }
                catch
                {
                    loaders.Add(loaderId.ToString().Substring(0, 8));
                }
            }

            // 🔥 ГЕНЕРИРУЕМ НОВОЕ ИМЯ ФАЙЛА
            var extension = Path.GetExtension(oldFileName);

            // Защита от пустых списков
            if (!versions.Any()) versions = new List<string> { "unknown" };
            if (!loaders.Any()) loaders = new List<string> { "unknown" };

            var cleanVersions = versions.Select(v =>
                System.Text.RegularExpressions.Regex.Replace(v, @"[^a-zA-Z0-9._-]", ""))
                .Where(v => !string.IsNullOrEmpty(v))
                .ToList();

            var cleanLoaders = loaders.Select(l =>
                System.Text.RegularExpressions.Regex.Replace(l, @"[^a-zA-Z0-9._-]", ""))
                .Where(l => !string.IsNullOrEmpty(l))
                .ToList();

            if (!cleanVersions.Any()) cleanVersions = new List<string> { "unknown" };
            if (!cleanLoaders.Any()) cleanLoaders = new List<string> { "unknown" };

            var versionsStr = string.Join("-", cleanVersions.Select(v => v.Replace(" ", "_").Replace(".", "_")));
            var loadersStr = string.Join("-", cleanLoaders.Select(l => l.Replace(" ", "_")));

            string uuid;
            if (!string.IsNullOrEmpty(modId))
            {
                uuid = modId.Replace("-", "").Substring(0, 8);
            }
            else
            {
                uuid = Guid.NewGuid().ToString().Replace("-", "").Substring(0, 8);
            }

            var newFileName = $"{versionsStr}_{loadersStr}_{uuid}{extension}";
            var newFilePath = Path.Combine(modsPath, newFileName);

            // 🔥 ПЕРЕИМЕНОВЫВАЕМ ФАЙЛ
            System.IO.File.Move(oldFilePath, newFilePath);
            Console.WriteLine($"✅ Файл переименован: {oldFileName} -> {newFileName}");

            // 🔥 ПОЛУЧАЕМ БАЗОВЫЙ URL
            var request = HttpContext.Request;
            var baseUrl = $"{request.Scheme}://{request.Host}";

            var result = new
            {
                fileName = newFileName,
                originalFileName = oldFileName,
                filePath = $"/mods/{newFileName}",
                fileSize = new FileInfo(newFilePath).Length,
                downloadUrl = $"{baseUrl}/mods/{WebUtility.UrlEncode(newFileName)}",
                versionIds = versionIdList,
                modLoaderIds = loaderIdList,
                versions = versions,
                modLoaders = loaders,
                modId = modId
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"💥 Ошибка переименования файла: {ex}");
            return StatusCode(500, $"Ошибка переименования файла: {ex.Message}");
        }
    }

    [HttpGet("mods/{fileName}")]
    public async Task<IActionResult> DownloadModFile(string fileName)
    {
        try
        {
            var modsPath = Path.Combine(_environment.WebRootPath, "mods");
            var filePath = Path.Combine(modsPath, fileName);

            if (!System.IO.File.Exists(filePath))
                return NotFound("Файл мода не найден");

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            var contentType = GetContentType(Path.GetExtension(filePath));

            return File(fileBytes, contentType, fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Ошибка при скачивании файла: {ex.Message}");
        }
    }

    [Authorize]
    [HttpDelete("mods/{fileName}")]
    public async Task<ActionResult> DeleteModFile(string fileName)
    {
        try
        {
            var modsPath = Path.Combine(_environment.WebRootPath, "mods");
            var filePath = Path.Combine(modsPath, fileName);

            if (!System.IO.File.Exists(filePath))
                return NotFound("Файл мода не найден");

            System.IO.File.Delete(filePath);
            return Ok("Файл мода успешно удален");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Ошибка при удалении файла: {ex.Message}");
        }
    }


    [Authorize]
    [HttpPost("gallery-image")]
    public async Task<ActionResult<string>> UploadGalleryImage(IFormFile file, [FromForm] Guid modId) // ← ДОБАВЬ [FromForm]
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest("Файл не выбран");

            // Проверка типа файла
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
                return BadRequest("Недопустимый формат файла");

            // Проверка размера файла (5MB)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest("Файл слишком большой (макс. 5MB)");

            Console.WriteLine($"📥 Получен modId: {modId}"); // ← ДЛЯ ДЕБАГА

            // 🔥 ГЕНЕРАЦИЯ ИМЕНИ ФАЙЛА: номеркартинкиIDмода.расширение
            var imageNumber = await GetNextImageNumber(modId);
            var fileName = $"{imageNumber}_{modId}{fileExtension}";
            var filePath = Path.Combine(_environment.WebRootPath, "modsGallery", fileName);

            // Создание директории если не существует
            var directory = Path.GetDirectoryName(filePath);
            if (!Directory.Exists(directory))
                Directory.CreateDirectory(directory);

            // Сохранение файла
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/modsGallery/{fileName}";
            Console.WriteLine($"✅ Загружено изображение галереи: {imageUrl}");

            return Ok(imageUrl);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Ошибка загрузки изображения галереи: {ex.Message}");
            return StatusCode(500, "Ошибка при загрузке изображения");
        }
    }

    private async Task<int> GetNextImageNumber(Guid modId)
    {
        try
        {
            Console.WriteLine($"🔍 Поиск изображений для modId: {modId}"); // ← ДЕБАГ

            var galleryPath = Path.Combine(_environment.WebRootPath, "modsGallery");
            if (!Directory.Exists(galleryPath))
            {
                Console.WriteLine("📁 Папка modsGallery не существует, создаем...");
                Directory.CreateDirectory(galleryPath);
                return 1;
            }

            // Ищем файлы, которые уже существуют для этого мода
            var searchPattern = $"*_{modId}.*";
            Console.WriteLine($"🔍 Поиск по шаблону: {searchPattern}");

            var existingFiles = Directory.GetFiles(galleryPath, searchPattern)
                .Select(Path.GetFileName)
                .Where(name => name != null && name.Contains(modId.ToString()))
                .ToList();

            Console.WriteLine($"📊 Найдено файлов: {existingFiles.Count}");
            foreach (var file in existingFiles)
            {
                Console.WriteLine($"📄 Найден файл: {file}");
            }

            if (existingFiles.Count == 0)
                return 1;

            // Извлекаем номера из имен файлов
            var numbers = new List<int>();
            foreach (var fileName in existingFiles)
            {
                var parts = fileName.Split('_');
                if (parts.Length >= 2 && int.TryParse(parts[0], out int number))
                {
                    numbers.Add(number);
                    Console.WriteLine($"🔢 Извлечен номер: {number} из {fileName}");
                }
            }

            var nextNumber = numbers.Count > 0 ? numbers.Max() + 1 : 1;
            Console.WriteLine($"🎯 Следующий номер: {nextNumber}");

            return nextNumber;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Ошибка при получении номера изображения: {ex.Message}");
            return 1;
        }
    }

    [Authorize]
    [HttpDelete("gallery-image/{fileName}")]
    public async Task<ActionResult> DeleteGalleryImage(string fileName)
    {
        try
        {
            var filePath = Path.Combine(_environment.WebRootPath, "modsGallery", fileName);

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
                Console.WriteLine($"🗑️ Удален файл галереи: {fileName}");
                return Ok(new { message = "Файл удален" });
            }
            else
            {
                Console.WriteLine($"⚠️ Файл не найден: {fileName}");
                return NotFound(new { message = "Файл не найден" });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Ошибка удаления файла галереи: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при удалении файла" });
        }
    }
    [Authorize]
    [HttpDelete("delete-image/{fileName}")]
    public async Task<ActionResult> DeleteImage(string fileName)
    {
        try
        {
            var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads");
            var filePath = Path.Combine(uploadsPath, fileName);

            if (!System.IO.File.Exists(filePath))
                return NotFound("Файл изображения не найден");

            System.IO.File.Delete(filePath);
            return Ok("Изображение успешно удалено");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Ошибка при удалении изображения: {ex.Message}");
        }
    }

    private async Task<List<string>> GetVersionTitles(List<Guid> versionIds)
    {
        var versions = new List<string>();
        foreach (var versionId in versionIds)
        {
            try
            {
                var version = await _versionRepository.GetById(versionId);
                versions.Add(version?.Title ?? versionId.ToString().Substring(0, 8));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Ошибка получения версии {versionId}: {ex.Message}");
                versions.Add(versionId.ToString().Substring(0, 8));
            }
        }
        return versions;
    }

    private async Task<List<string>> GetLoaderTitles(List<Guid> loaderIds)
    {
        var loaders = new List<string>();
        foreach (var loaderId in loaderIds)
        {
            try
            {
                var loader = await _modLoaderRepository.GetById(loaderId);
                loaders.Add(loader.Title);
            }
            catch
            {
                loaders.Add(loaderId.ToString().Substring(0, 8));
            }
        }
        return loaders;
    }

    private string GenerateFileName(List<string> versions, List<string> loaders, string extension, string modId)
    {
        // Защита от пустых списков
        if (!versions.Any()) versions = new List<string> { "unknown" };
        if (!loaders.Any()) loaders = new List<string> { "unknown" };

        var cleanVersions = versions.Select(v =>
            System.Text.RegularExpressions.Regex.Replace(v, @"[^a-zA-Z0-9._-]", ""))
            .Where(v => !string.IsNullOrEmpty(v))
            .ToList();

        var cleanLoaders = loaders.Select(l =>
            System.Text.RegularExpressions.Regex.Replace(l, @"[^a-zA-Z0-9._-]", ""))
            .Where(l => !string.IsNullOrEmpty(l))
            .ToList();

        // Еще раз проверяем на случай если все строки стали пустыми
        if (!cleanVersions.Any()) cleanVersions = new List<string> { "unknown" };
        if (!cleanLoaders.Any()) cleanLoaders = new List<string> { "unknown" };

        var versionsStr = string.Join("-", cleanVersions.Select(v => v.Replace(" ", "_").Replace(".", "_")));
        var loadersStr = string.Join("-", cleanLoaders.Select(l => l.Replace(" ", "_")));

        // Используем modId как UUID если он передан, иначе генерируем новый
        string uuid;
        if (!string.IsNullOrEmpty(modId))
        {
            // Берем первые 8 символов UUID без дефисов
            uuid = modId.Replace("-", "").Substring(0, 8);
            Console.WriteLine($"🔑 Используем UUID мода: {uuid}");
        }
        else
        {
            uuid = Guid.NewGuid().ToString().Replace("-", "").Substring(0, 8);
            Console.WriteLine($"🔑 Сгенерирован новый UUID: {uuid}");
        }

        return $"{versionsStr}_{loadersStr}_{uuid}{extension}";
    }

    private string GetContentType(string extension)
    {
        return extension.ToLowerInvariant() switch
        {
            ".jar" => "application/java-archive",
            ".zip" => "application/zip",
            ".rar" => "application/vnd.rar",
            ".7z" => "application/x-7z-compressed",
            _ => "application/octet-stream"
        };
    }

    private string GetBaseUrl()
    {
        var request = HttpContext.Request;
        return $"{request.Scheme}://{request.Host}";
    }
}