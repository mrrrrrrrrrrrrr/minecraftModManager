namespace DTO.ModGallery;
public class ModGalleryDto
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = "";
    public string FileName { get; set; } = "";
    public int DisplayOrder { get; set; }
    public Guid ModId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}