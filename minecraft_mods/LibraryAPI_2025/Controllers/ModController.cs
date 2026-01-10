using BLL.Interfaces;
using DTO.Mod;
using DTO.Shared;
using DTO.DownloadSource;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO; 
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using DAL.Repositories;

namespace LibraryAPI_2025.Controllers;

[ApiController]
[Route("mods")]
public class ModController : ControllerBase
{
    private readonly IService<ModDto, CreateModDto, UpdateModDto> _service;
    private readonly IService<DownloadSourceDto, CreateDownloadSourceDto, UpdateDownloadSourceDto> _downloadSourceService;
    private readonly IWebHostEnvironment _environment;

    public ModController(
        IService<ModDto, CreateModDto, UpdateModDto> service,
        IService<DownloadSourceDto, CreateDownloadSourceDto, UpdateDownloadSourceDto> downloadSourceService,
        IWebHostEnvironment environment)
    {
        _service = service;
        _downloadSourceService = downloadSourceService;
        _environment = environment;
    }

    [HttpGet("getAll")]
    public async Task<ActionResult<List<ModDto>>> GetAll() => Ok(await _service.GetAll());

    [HttpGet]
    public async Task<ActionResult<QueryParamsDto<ModDto>>> GetByPage([FromQuery] QueryParamsDto<ModDto> queryParams)
    {
        if (queryParams.PageNumber < 1 || queryParams.PageSize < 1)
        {
            return BadRequest("Page number and page size must be positive integers.");
        }

        var result = await _service.GetByPage(queryParams);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ModDto>> GetById(Guid id) => Ok(await _service.GetById(id));

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ModDto>> Create([FromBody] CreateModDto mod) => Ok(await _service.Create(mod));

    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<ModDto>> Update(Guid id, [FromBody] UpdateModDto mod)
    {
        mod.Id = id;
        return Ok(await _service.Update(mod));
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        try
        {
            // 1. Получаем мод
            var mod = await _service.GetById(id);
            if (mod == null)
                return NotFound(new { message = "Мод не найден" });

            // 2. Удаляем файлы
            await DeleteModFiles(mod);

            // 3. Удаляем запись из БД
            await _service.Delete(id);

            return Ok(new { message = "Мод и все файлы удалены" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка при удалении мода", error = ex.Message });
        }
    }

    private async Task DeleteModFiles(ModDto mod)
    {
        try
        {
            var wwwrootPath = _environment.WebRootPath;

            // 1. Удаляем аватарку
            if (!string.IsNullOrEmpty(mod.ImageUrl))
            {
                var imageName = Path.GetFileName(mod.ImageUrl);
                if (!string.IsNullOrEmpty(imageName))
                {
                    var imagePath = Path.Combine(wwwrootPath, "uploads", imageName);
                    if (System.IO.File.Exists(imagePath))
                    {
                        System.IO.File.Delete(imagePath);
                        Console.WriteLine($"🗑️ Удалена аватарка: {imagePath}");
                    }
                }
            }

            // 2. 🔥 УДАЛЯЕМ ТОЛЬКО ФАЙЛЫ ЭТОГО МОДА ПО MOD ID
            var modsPath = Path.Combine(wwwrootPath, "mods");

            if (Directory.Exists(modsPath))
            {
                // 🔥 Ищем файлы, содержащие ID мода в имени
                var modIdShort = mod.Id.ToString().Replace("-", "").Substring(0, 8);
                var modFiles = Directory.GetFiles(modsPath)
                    .Where(file => Path.GetFileName(file).Contains(modIdShort))
                    .ToList();

                Console.WriteLine($"🔍 Найдено {modFiles.Count} файлов мода с ID: {modIdShort}");

                foreach (var filePath in modFiles)
                {
                    System.IO.File.Delete(filePath);
                    Console.WriteLine($"🗑️ Удален файл мода: {Path.GetFileName(filePath)}");
                }

                // 🔥 Дополнительно ищем файлы с полным GUID (на всякий случай)
                var modIdFull = mod.Id.ToString().Replace("-", "");
                var modFilesFull = Directory.GetFiles(modsPath)
                    .Where(file => Path.GetFileName(file).Contains(modIdFull))
                    .ToList();

                if (modFilesFull.Any())
                {
                    Console.WriteLine($"🔍 Найдено {modFilesFull.Count} файлов с полным GUID");
                    foreach (var filePath in modFilesFull)
                    {
                        System.IO.File.Delete(filePath);
                        Console.WriteLine($"🗑️ Удален файл (полный GUID): {Path.GetFileName(filePath)}");
                    }
                }

                if (modFiles.Count == 0 && modFilesFull.Count == 0)
                {
                    Console.WriteLine($"ℹ️ Не найдено файлов для мода {mod.Id}");
                }
            }
            else
            {
                Console.WriteLine($"❌ Папка mods не существует: {modsPath}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Ошибка при удалении файлов мода: {ex.Message}");
        }
    }
}