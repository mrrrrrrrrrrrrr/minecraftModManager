// DAL/Entities/ModGallery.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DAL.Entities;

public class ModGallery : BaseEntity
{
    public string ImageUrl { get; set; } = "";
    public string FileName { get; set; } = "";
    public int DisplayOrder { get; set; } = 0; // Порядок отображения в галерее
    
    // Связь с модом
    public Guid ModId { get; set; }
    public Mod Mod { get; set; } = null!;
}

public class ModGalleryMap
{
    public ModGalleryMap(EntityTypeBuilder<ModGallery> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ImageUrl).IsRequired();
        builder.Property(x => x.FileName).IsRequired();
        builder.Property(x => x.DisplayOrder).IsRequired();
        
        // Связь с модом
        builder
            .HasOne(gi => gi.Mod)
            .WithMany(m => m.ModGalleries)
            .HasForeignKey(gi => gi.ModId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}