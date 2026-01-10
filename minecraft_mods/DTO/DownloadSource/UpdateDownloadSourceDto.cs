namespace DTO.DownloadSource;

public class UpdateDownloadSourceDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string? Url { get; set; }
    public string? FilePath { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public List<Guid> VersionIds { get; set; } = new();
    public List<Guid> ModLoaderIds { get; set; } = new();
}