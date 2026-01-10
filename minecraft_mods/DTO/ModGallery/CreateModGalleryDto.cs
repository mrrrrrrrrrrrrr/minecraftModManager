namespace DTO.ModGallery;
public class CreateModGalleryDto
{
    public string ImageUrl { get; set; } = "";
    public string FileName { get; set; } = "";
    public int DisplayOrder { get; set; }
    public Guid ModId { get; set; }
}