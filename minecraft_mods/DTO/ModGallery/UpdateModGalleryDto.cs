namespace DTO.ModGallery;
public class UpdateModGalleryDto
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = "";
    public string FileName { get; set; } = "";
    public int DisplayOrder { get; set; }
}