// DAL/Entities/ModLoader.cs
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DAL.Entities;

public class ModLoader : BaseEntity
{
    public string Title { get; set; } = "";
    public List<Mod> Mods { get; set; } = new();
    public List<Collection> Collections { get; set; } = new();
    public List<DownloadSource> DownloadSources { get; set; } = new(); // ← ДОБАВЛЕНО
}

public class ModLoaderMap
{
    public ModLoaderMap(EntityTypeBuilder<ModLoader> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).IsRequired();
        
        builder
            .HasMany(v => v.Mods)
            .WithMany(m => m.ModLoaders);

        // ДОБАВИТЬ связь с DownloadSources
        builder
            .HasMany(ml => ml.DownloadSources)
            .WithMany(ds => ds.ModLoaders);
    }
}