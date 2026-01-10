using DTO.ModLoader;
using DTO.ModVersion;

namespace DTO.DownloadSource;

public class DownloadSourceDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string? Url { get; set; }
    public string? FilePath { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public Guid ModId { get; set; }
    public List<ModVersionDto> Versions { get; set; } = new();
    public List<ModLoaderDto> ModLoaders { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}