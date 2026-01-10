// DAL/Repositories/DownloadSourceRepository.cs
using DAL.EF;
using DAL.Entities;
using DAL.Interfaces;
using DTO.DownloadSource;
using DTO.ModLoader;
using DTO.ModVersion;
using DTO.Shared;
using Microsoft.EntityFrameworkCore;

namespace DAL.Repositories;

public class DownloadSourceRepository(ApplicationContext context) : IRepository<DownloadSourceDto, CreateDownloadSourceDto, UpdateDownloadSourceDto>
{
    public async Task<List<DownloadSourceDto>> GetAll()
    {
        var downloadSources = await context.DownloadSources
            .Include(ds => ds.Versions)
            .Include(ds => ds.ModLoaders)
            .Include(ds => ds.Mod)
            .ToListAsync();

        return downloadSources.Select(ds => new DownloadSourceDto()
        {
            Id = ds.Id,
            Title = ds.Title,
            Url = ds.Url,
            FilePath = ds.FilePath,
            FileName = ds.FileName,
            FileSize = ds.FileSize,
            ModId = ds.ModId,
            Versions = ds.Versions.Select(v => new ModVersionDto()
            {
                Id = v.Id,
                Title = v.Title,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            }).ToList(),
            ModLoaders = ds.ModLoaders.Select(ml => new ModLoaderDto()
            {
                Id = ml.Id,
                Title = ml.Title,
                CreatedAt = ml.CreatedAt,
                UpdatedAt = ml.UpdatedAt
            }).ToList(),
            CreatedAt = ds.CreatedAt,
            UpdatedAt = ds.UpdatedAt
        }).ToList();
    }

    public async Task<QueryParamsDto<DownloadSourceDto>> GetByPage(QueryParamsDto<DownloadSourceDto> queryParams)
    {
        var query = context.DownloadSources
            .Include(ds => ds.Versions)
            .Include(ds => ds.ModLoaders)
            .Include(ds => ds.Mod)
            .AsNoTracking();

        var totalCount = await query.CountAsync();
        
        var items = await query
            .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .Select(ds => new DownloadSourceDto()
            {
                Id = ds.Id,
                Title = ds.Title,
                Url = ds.Url,
                FilePath = ds.FilePath,
                FileName = ds.FileName,
                FileSize = ds.FileSize,
                ModId = ds.ModId,
                Versions = ds.Versions.Select(v => new ModVersionDto()
                {
                    Id = v.Id,
                    Title = v.Title,
                    CreatedAt = v.CreatedAt,
                    UpdatedAt = v.UpdatedAt
                }).ToList(),
                ModLoaders = ds.ModLoaders.Select(ml => new ModLoaderDto()
                {
                    Id = ml.Id,
                    Title = ml.Title,
                    CreatedAt = ml.CreatedAt,
                    UpdatedAt = ml.UpdatedAt
                }).ToList(),
                CreatedAt = ds.CreatedAt,
                UpdatedAt = ds.UpdatedAt
            })
            .ToListAsync();

        return new QueryParamsDto<DownloadSourceDto>()
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParams.PageNumber,
            PageSize = queryParams.PageSize
        };
    }

    public async Task<DownloadSourceDto> GetById(Guid id)
    {
        var downloadSource = await context.DownloadSources
            .Include(ds => ds.Versions)
            .Include(ds => ds.ModLoaders)
            .Include(ds => ds.Mod)
            .FirstOrDefaultAsync(ds => ds.Id == id);

        if (downloadSource == null)
        {
            throw new KeyNotFoundException($"Download source with id {id} not found");
        }

        return new DownloadSourceDto()
        {
            Id = downloadSource.Id,
            Title = downloadSource.Title,
            Url = downloadSource.Url,
            FilePath = downloadSource.FilePath,
            FileName = downloadSource.FileName,
            FileSize = downloadSource.FileSize,
            ModId = downloadSource.ModId,
            Versions = downloadSource.Versions.Select(v => new ModVersionDto()
            {
                Id = v.Id,
                Title = v.Title,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            }).ToList(),
            ModLoaders = downloadSource.ModLoaders.Select(ml => new ModLoaderDto()
            {
                Id = ml.Id,
                Title = ml.Title,
                CreatedAt = ml.CreatedAt,
                UpdatedAt = ml.UpdatedAt
            }).ToList(),
            CreatedAt = downloadSource.CreatedAt,
            UpdatedAt = downloadSource.UpdatedAt
        };
    }

    public async Task<DownloadSourceDto> Create(CreateDownloadSourceDto downloadSource)
    {
        var mod = await context.Mods.FindAsync(downloadSource.ModId);
        if (mod == null)
        {
            throw new ArgumentException($"Mod with id {downloadSource.ModId} not found");
        }

        var versions = await context.ModVersions
            .Where(v => downloadSource.VersionIds.Contains(v.Id))
            .ToListAsync();
        
        var modLoaders = await context.ModLoaders
            .Where(ml => downloadSource.ModLoaderIds.Contains(ml.Id))
            .ToListAsync();

        if (!versions.Any())
        {
            throw new ArgumentException("At least one version must be specified");
        }

        if (!modLoaders.Any())
        {
            throw new ArgumentException("At least one mod loader must be specified");
        }

        var createdDownloadSource = new DownloadSource()
        {
            Title = downloadSource.Title,
            Url = downloadSource.Url,
            FilePath = downloadSource.FilePath,
            FileName = downloadSource.FileName,
            FileSize = downloadSource.FileSize,
            ModId = downloadSource.ModId,
            Versions = versions,
            ModLoaders = modLoaders,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (string.IsNullOrWhiteSpace(downloadSource.Title))
        {
            throw new ArgumentException("Title cannot be empty");
        }

        if (downloadSource.Title.Length > 200)
        {
            throw new ArgumentException("Title is too long (max 200 chars)");
        }

        if (string.IsNullOrEmpty(downloadSource.Url) && string.IsNullOrEmpty(downloadSource.FilePath))
        {
            throw new ArgumentException("Either URL or FilePath must be specified");
        }

        context.DownloadSources.Add(createdDownloadSource);
        await context.SaveChangesAsync();

        return await GetById(createdDownloadSource.Id);
    }

    public async Task<DownloadSourceDto> Update(UpdateDownloadSourceDto downloadSource)
    {
        var existingDownloadSource = await context.DownloadSources
            .Include(ds => ds.Versions)
            .Include(ds => ds.ModLoaders)
            .FirstOrDefaultAsync(ds => ds.Id == downloadSource.Id);

        if (existingDownloadSource == null)
        {
            throw new KeyNotFoundException($"Download source with id {downloadSource.Id} not found");
        }

        var versions = await context.ModVersions
            .Where(v => downloadSource.VersionIds.Contains(v.Id))
            .ToListAsync();
        
        var modLoaders = await context.ModLoaders
            .Where(ml => downloadSource.ModLoaderIds.Contains(ml.Id))
            .ToListAsync();

        if (!versions.Any())
        {
            throw new ArgumentException("At least one version must be specified");
        }

        if (!modLoaders.Any())
        {
            throw new ArgumentException("At least one mod loader must be specified");
        }

        existingDownloadSource.Title = downloadSource.Title;
        existingDownloadSource.Url = downloadSource.Url;
        existingDownloadSource.FilePath = downloadSource.FilePath;
        existingDownloadSource.FileName = downloadSource.FileName;
        existingDownloadSource.FileSize = downloadSource.FileSize;
        existingDownloadSource.Versions = versions;
        existingDownloadSource.ModLoaders = modLoaders;
        existingDownloadSource.UpdatedAt = DateTime.UtcNow;

        if (string.IsNullOrWhiteSpace(downloadSource.Title))
        {
            throw new ArgumentException("Title cannot be empty");
        }

        if (downloadSource.Title.Length > 200)
        {
            throw new ArgumentException("Title is too long (max 200 chars)");
        }

        if (string.IsNullOrEmpty(downloadSource.Url) && string.IsNullOrEmpty(downloadSource.FilePath))
        {
            throw new ArgumentException("Either URL or FilePath must be specified");
        }

        context.DownloadSources.Update(existingDownloadSource);
        await context.SaveChangesAsync();

        return await GetById(existingDownloadSource.Id);
    }

    public async Task Delete(Guid id)
    {
        var downloadSource = await context.DownloadSources.FindAsync(id);
        
        if (downloadSource == null)
        {
            throw new KeyNotFoundException($"Download source with id {id} not found");
        }
        
        context.DownloadSources.Remove(downloadSource);
        await context.SaveChangesAsync();
    }
}