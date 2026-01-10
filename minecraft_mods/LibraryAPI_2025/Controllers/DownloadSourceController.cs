// Controllers/DownloadSourceController.cs
using BLL.Interfaces;
using DTO.DownloadSource;
using DTO.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;

namespace LibraryAPI_2025.Controllers;

[ApiController]
[Route("download-sources")]
public class DownloadSourceController : ControllerBase
{
    private readonly IService<DownloadSourceDto, CreateDownloadSourceDto, UpdateDownloadSourceDto> _service;
    private readonly IWebHostEnvironment _environment;

    public DownloadSourceController(
        IService<DownloadSourceDto, CreateDownloadSourceDto, UpdateDownloadSourceDto> service,
        IWebHostEnvironment environment)
    {
        _service = service;
        _environment = environment;
    }

    [HttpGet("getAll")]
    public async Task<ActionResult<List<DownloadSourceDto>>> GetAll() => Ok(await _service.GetAll());

    [HttpGet]
    public async Task<ActionResult<QueryParamsDto<DownloadSourceDto>>> GetByPage([FromQuery] QueryParamsDto<DownloadSourceDto> queryParams)
    {
        if (queryParams.PageNumber < 1 || queryParams.PageSize < 1)
        {
            return BadRequest("Page number and page size must be positive integers.");
        }

        var result = await _service.GetByPage(queryParams);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DownloadSourceDto>> GetById(Guid id) => Ok(await _service.GetById(id));

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<DownloadSourceDto>> Create([FromBody] CreateDownloadSourceDto downloadSource) => Ok(await _service.Create(downloadSource));

    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<DownloadSourceDto>> Update(Guid id, [FromBody] UpdateDownloadSourceDto downloadSource)
    {
        downloadSource.Id = id;
        return Ok(await _service.Update(downloadSource));
    }

    [HttpGet("mod/{modId}")]
    public async Task<ActionResult<List<DownloadSourceDto>>> GetByModId(Guid modId)
    {
        try
        {
            var allSources = await _service.GetAll();
            var filteredSources = allSources.Where(source => source.ModId == modId).ToList();
            
            Console.WriteLine($"🔍 Запрошены источники для мода {modId}, найдено: {filteredSources.Count}");
            
            return Ok(filteredSources);
        }
        catch (Exception ex) 
        {
            Console.WriteLine($"❌ Ошибка при получении источников для мода {modId}: {ex.Message}");
            return StatusCode(500, $"Ошибка при получении источников: {ex.Message}");
        }
    }

    [Authorize]
[HttpDelete("{id}")]
public async Task<ActionResult> Delete(Guid id)
{
    try
    {
        // 1. Получаем источник чтобы узнать файл
        var source = await _service.GetById(id);
        if (source == null)
            return NotFound("Источник скачивания не найден");

        Console.WriteLine($"🔍 Удаление источника {id}");
        Console.WriteLine($"📁 FileName из БД: {source.FileName}");
        Console.WriteLine($"📁 FilePath из БД: {source.FilePath}");

        // 2. Удаляем файл с сервера если он есть
        if (!string.IsNullOrEmpty(source.FilePath))
        {
            try
            {
                // 🔥 ИЗВЛЕКАЕМ ИМЯ ФАЙЛА ИЗ ПУТИ: "/mods/filename.jar" → "filename.jar"
                var fileNameFromPath = Path.GetFileName(source.FilePath);
                Console.WriteLine($"🔍 Извлеченное имя файла из FilePath: {fileNameFromPath}");

                var modsPath = Path.Combine(_environment.WebRootPath, "mods");
                var filePath = Path.Combine(modsPath, fileNameFromPath);
                
                Console.WriteLine($"🔍 Ищем файл по пути: {filePath}");
                
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    Console.WriteLine($"🗑️ Файл источника удален: {fileNameFromPath}");
                }
                else
                {
                    Console.WriteLine($"⚠️ Файл не найден: {fileNameFromPath}");
                    
                    // Дополнительная диагностика
                    if (Directory.Exists(modsPath))
                    {
                        var files = Directory.GetFiles(modsPath);
                        Console.WriteLine($"🔍 Файлы в папке mods ({files.Length}):");
                        foreach (var file in files.Take(10)) // первые 10 файлов
                        {
                            Console.WriteLine($"   - {Path.GetFileName(file)}");
                        }
                    }
                }
            }
            catch (Exception fileEx)
            {
                Console.WriteLine($"⚠️ Не удалось удалить файл: {fileEx.Message}");
            }
        }
        else
        {
            Console.WriteLine("ℹ️ Нет FilePath для удаления файла");
        }

        // 3. Удаляем запись из БД
        await _service.Delete(id);
        
        Console.WriteLine($"✅ Источник скачивания {id} удален");
        return Ok(new { message = "Источник скачивания и файл удалены" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Ошибка удаления источника {id}: {ex.Message}");
        return StatusCode(500, $"Ошибка при удалении источника: {ex.Message}");
    }
}
}