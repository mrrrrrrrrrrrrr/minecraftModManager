// DAL/Entities/DownloadSource.cs
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DAL.Entities;

public class DownloadSource : BaseEntity
{
    public string Title { get; set; } = "";
    public string? Url { get; set; } // Внешняя ссылка
    public string? FilePath { get; set; } // Путь к файлу на сервере
    public string? FileName { get; set; } // Оригинальное имя файла
    public long? FileSize { get; set; } // Размер файла в байтах
    
    // Связи
    public Guid ModId { get; set; }
    public Mod Mod { get; set; } = null!;
    
    public List<ModVersion> Versions { get; set; } = new();
    public List<ModLoader> ModLoaders { get; set; } = new();
}

public class DownloadSourceMap
{
    public DownloadSourceMap(EntityTypeBuilder<DownloadSource> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Url).IsRequired(false).HasMaxLength(500);
        builder.Property(x => x.FilePath).IsRequired(false).HasMaxLength(500);
        builder.Property(x => x.FileName).IsRequired(false).HasMaxLength(255);
        builder.Property(x => x.FileSize).IsRequired(false);
        
        // Связь с модом
        builder.HasOne(ds => ds.Mod)
            .WithMany(m => m.DownloadSources)
            .HasForeignKey(ds => ds.ModId);
        
        // Связи многие-ко-многим с версиями и загрузчиками
        builder
            .HasMany(ds => ds.Versions)
            .WithMany(v => v.DownloadSources);
        
        builder
            .HasMany(ds => ds.ModLoaders)
            .WithMany(ml => ml.DownloadSources);
    }
}