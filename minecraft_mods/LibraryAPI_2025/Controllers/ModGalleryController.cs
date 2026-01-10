using BLL.Interfaces;
using DTO.ModGallery;
using DTO.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryAPI_2025.Controllers;

[ApiController]
[Route("modgalleries")]
public class ModGalleriesController : ControllerBase
{
    private readonly IService<ModGalleryDto, CreateModGalleryDto, UpdateModGalleryDto> _service;

    public ModGalleriesController(IService<ModGalleryDto, CreateModGalleryDto, UpdateModGalleryDto> service)
    {
        _service = service;
    }

    [HttpGet("getAll")]
    public async Task<ActionResult<List<ModGalleryDto>>> GetAll() => Ok(await _service.GetAll());

    [HttpGet]
    public async Task<ActionResult<QueryParamsDto<ModGalleryDto>>> GetByPage([FromQuery] QueryParamsDto<ModGalleryDto> queryParams)
    {
        if (queryParams.PageNumber < 1 || queryParams.PageSize < 1)
        {
            return BadRequest("Page number and page size must be positive integers.");
        }

        var result = await _service.GetByPage(queryParams);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ModGalleryDto>> GetById(Guid id) => Ok(await _service.GetById(id));

    [HttpGet("mod/{modId}")]
    public async Task<ActionResult<List<ModGalleryDto>>> GetByModId(Guid modId)
    {
        var allImages = await _service.GetAll();
        var modImages = allImages.Where(x => x.ModId == modId)
                                .OrderBy(x => x.DisplayOrder)
                                .ToList();
        return Ok(modImages);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ModGalleryDto>> Create([FromBody] CreateModGalleryDto gallery) => Ok(await _service.Create(gallery));

    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<ModGalleryDto>> Update(Guid id, [FromBody] UpdateModGalleryDto gallery)
    {
        gallery.Id = id;
        return Ok(await _service.Update(gallery));
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        try
        {
            // Получаем информацию об изображении перед удалением
            var galleryItem = await _service.GetById(id);
            if (galleryItem == null)
                return NotFound(new { message = "Изображение галереи не найдено" });

            // TODO: Добавить удаление файла изображения с сервера
            // await DeleteGalleryImageFile(galleryItem.ImageUrl);

            await _service.Delete(id);
            return Ok(new { message = "Изображение галереи удалено" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка при удалении изображения галереи", error = ex.Message });
        }
    }

    [Authorize]
    [HttpDelete("mod/{modId}")]
    public async Task<ActionResult> DeleteByModId(Guid modId)
    {
        try
        {
            var allImages = await _service.GetAll();
            var modImages = allImages.Where(x => x.ModId == modId).ToList();

            foreach (var image in modImages)
            {
                // TODO: Добавить удаление файлов изображений
                // await DeleteGalleryImageFile(image.ImageUrl);
                await _service.Delete(image.Id);
            }

            return Ok(new { message = $"Удалено {modImages.Count} изображений галереи" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка при удалении галереи мода", error = ex.Message });
        }
    }

    // TODO: Реализовать метод для удаления файлов изображений
    // private async Task DeleteGalleryImageFile(string imageUrl)
    // {
    //     try
    //     {
    //         if (!string.IsNullOrEmpty(imageUrl))
    //         {
    //             var fileName = Path.GetFileName(imageUrl);
    //             if (!string.IsNullOrEmpty(fileName))
    //             {
    //                 var filePath = Path.Combine(_environment.WebRootPath, "modsGallery", fileName);
    //                 if (System.IO.File.Exists(filePath))
    //                 {
    //                     System.IO.File.Delete(filePath);
    //                     Console.WriteLine($"🗑️ Удалено изображение галереи: {filePath}");
    //                 }
    //             }
    //         }
    //     }
    //     catch (Exception ex)
    //     {
    //         Console.WriteLine($"⚠️ Ошибка при удалении файла изображения галереи: {ex.Message}");
    //     }
    // }
}