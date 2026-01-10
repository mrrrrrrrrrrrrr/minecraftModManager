// DAL/Repositories/ModGalleryRepository.cs
using DAL.EF;
using DAL.Entities;
using DAL.Interfaces;
using DTO.ModGallery;
using DTO.Shared;
using Microsoft.EntityFrameworkCore;
using System.Linq.Dynamic.Core;

namespace DAL.Repositories;

public class ModGalleryRepository(ApplicationContext context) : IRepository<ModGalleryDto, CreateModGalleryDto, UpdateModGalleryDto>
{
    public async Task<List<ModGalleryDto>> GetAll()
    {
        List<ModGallery> galleries = await context.ModGalleries
            .Include(g => g.Mod)
            .ToListAsync();

        return galleries.Select(gallery => new ModGalleryDto()
        {
            Id = gallery.Id,
            ImageUrl = gallery.ImageUrl,
            FileName = gallery.FileName,
            DisplayOrder = gallery.DisplayOrder,
            ModId = gallery.ModId,
            CreatedAt = gallery.CreatedAt,
            UpdatedAt = gallery.UpdatedAt
        }).ToList();
    }

    public async Task<QueryParamsDto<ModGalleryDto>> GetByPage(QueryParamsDto<ModGalleryDto> queryParams)
    {
        var totalCount = await context.ModGalleries.CountAsync();
        
        // Настройка сортировки по умолчанию
        var sortBy = string.IsNullOrEmpty(queryParams.SortBy) ? "DisplayOrder" : queryParams.SortBy;
        var orderBy = string.IsNullOrEmpty(queryParams.OrderBy) ? "asc" : queryParams.OrderBy;
        string sorting = $"{sortBy} {(orderBy.ToLower() == "desc" ? "descending" : "ascending")}";

        var galleriesQuery = context.ModGalleries
            .Include(g => g.Mod)
            .AsQueryable();

        // Поиск по имени файла или URL изображения
        if (!string.IsNullOrEmpty(queryParams.Search))
        {
            galleriesQuery = galleriesQuery
                .Where(g =>
                    g.FileName.ToLower().Contains(queryParams.Search.ToLower()) ||
                    g.ImageUrl.ToLower().Contains(queryParams.Search.ToLower())
                );
        }

        // Применяем пагинацию после фильтрации
        var totalFilteredCount = await galleriesQuery.CountAsync();
        
        var items = await galleriesQuery
            .OrderBy(sorting)
            .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .Select(g => new ModGalleryDto()
            {
                Id = g.Id,
                ImageUrl = g.ImageUrl,
                FileName = g.FileName,
                DisplayOrder = g.DisplayOrder,
                ModId = g.ModId,
                CreatedAt = g.CreatedAt,
                UpdatedAt = g.UpdatedAt
            }).ToListAsync();

        return new QueryParamsDto<ModGalleryDto>()
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParams.PageNumber,
            PageSize = queryParams.PageSize,
            Search = queryParams.Search,
            SortBy = queryParams.SortBy,
            OrderBy = queryParams.OrderBy
        };
    }

    public async Task<ModGalleryDto> GetById(Guid id)
    {
        ModGallery? gallery = await context.ModGalleries
            .Include(g => g.Mod)
            .FirstOrDefaultAsync(g => g.Id == id);

        if (gallery == null)
        {
            throw new KeyNotFoundException($"ModGallery with id {id} not found");
        }

        return new ModGalleryDto()
        {
            Id = gallery.Id,
            ImageUrl = gallery.ImageUrl,
            FileName = gallery.FileName,
            DisplayOrder = gallery.DisplayOrder,
            ModId = gallery.ModId,
            CreatedAt = gallery.CreatedAt,
            UpdatedAt = gallery.UpdatedAt
        };
    }

    public async Task<ModGalleryDto> Create(CreateModGalleryDto galleryDto)
    {
        // Проверяем существование мода
        var mod = await context.Mods.FindAsync(galleryDto.ModId);
        if (mod == null)
        {
            throw new ArgumentException($"Mod with id {galleryDto.ModId} not found");
        }

        // Валидация
        if (string.IsNullOrWhiteSpace(galleryDto.ImageUrl))
        {
            throw new ArgumentException("ImageUrl cannot be empty");
        }

        if (string.IsNullOrWhiteSpace(galleryDto.FileName))
        {
            throw new ArgumentException("FileName cannot be empty");
        }

        if (galleryDto.DisplayOrder < 0)
        {
            throw new ArgumentException("DisplayOrder cannot be negative");
        }

        ModGallery gallery = new()
        {
            ImageUrl = galleryDto.ImageUrl,
            FileName = galleryDto.FileName,
            DisplayOrder = galleryDto.DisplayOrder,
            ModId = galleryDto.ModId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.ModGalleries.Add(gallery);
        await context.SaveChangesAsync();

        return new ModGalleryDto()
        {
            Id = gallery.Id,
            ImageUrl = gallery.ImageUrl,
            FileName = gallery.FileName,
            DisplayOrder = gallery.DisplayOrder,
            ModId = gallery.ModId,
            CreatedAt = gallery.CreatedAt,
            UpdatedAt = gallery.UpdatedAt
        };
    }

    public async Task<ModGalleryDto> Update(UpdateModGalleryDto galleryDto)
    {
        ModGallery? gallery = await context.ModGalleries
            .FirstOrDefaultAsync(g => g.Id == galleryDto.Id);

        if (gallery == null)
        {
            throw new KeyNotFoundException($"ModGallery with id {galleryDto.Id} not found");
        }

        // Валидация
        if (string.IsNullOrWhiteSpace(galleryDto.ImageUrl))
        {
            throw new ArgumentException("ImageUrl cannot be empty");
        }

        if (string.IsNullOrWhiteSpace(galleryDto.FileName))
        {
            throw new ArgumentException("FileName cannot be empty");
        }

        if (galleryDto.DisplayOrder < 0)
        {
            throw new ArgumentException("DisplayOrder cannot be negative");
        }

        gallery.ImageUrl = galleryDto.ImageUrl;
        gallery.FileName = galleryDto.FileName;
        gallery.DisplayOrder = galleryDto.DisplayOrder;
        gallery.UpdatedAt = DateTime.UtcNow;

        context.ModGalleries.Update(gallery);
        await context.SaveChangesAsync();

        return new ModGalleryDto()
        {
            Id = gallery.Id,
            ImageUrl = gallery.ImageUrl,
            FileName = gallery.FileName,
            DisplayOrder = gallery.DisplayOrder,
            ModId = gallery.ModId,
            CreatedAt = gallery.CreatedAt,
            UpdatedAt = gallery.UpdatedAt
        };
    }

    public async Task Delete(Guid id)
    {
        ModGallery? gallery = await context.ModGalleries.FindAsync(id);

        if (gallery == null)
        {
            throw new KeyNotFoundException($"ModGallery with id {id} not found");
        }

        context.ModGalleries.Remove(gallery);
        await context.SaveChangesAsync();
    }

    // Дополнительные методы для работы с галереей
    public async Task<List<ModGalleryDto>> GetByModId(Guid modId)
    {
        var galleries = await context.ModGalleries
            .Where(g => g.ModId == modId)
            .Include(g => g.Mod)
            .OrderBy(g => g.DisplayOrder)
            .ToListAsync();

        return galleries.Select(g => new ModGalleryDto()
        {
            Id = g.Id,
            ImageUrl = g.ImageUrl,
            FileName = g.FileName,
            DisplayOrder = g.DisplayOrder,
            ModId = g.ModId,
            CreatedAt = g.CreatedAt,
            UpdatedAt = g.UpdatedAt
        }).ToList();
    }

    public async Task DeleteByModId(Guid modId)
    {
        var galleries = await context.ModGalleries
            .Where(g => g.ModId == modId)
            .ToListAsync();

        context.ModGalleries.RemoveRange(galleries);
        await context.SaveChangesAsync();
    }
}