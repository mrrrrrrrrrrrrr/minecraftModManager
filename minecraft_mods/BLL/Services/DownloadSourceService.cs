// BLL/Services/DownloadSourceService.cs
using BLL.Interfaces;
using DAL.Interfaces;
using DTO.DownloadSource;
using DTO.Shared;

namespace BLL.Services;

public class DownloadSourceService(IRepository<DownloadSourceDto, CreateDownloadSourceDto, UpdateDownloadSourceDto> repository) 
    : IService<DownloadSourceDto, CreateDownloadSourceDto, UpdateDownloadSourceDto>
{
    public async Task<List<DownloadSourceDto>> GetAll() => await repository.GetAll();
    public async Task<QueryParamsDto<DownloadSourceDto>> GetByPage(QueryParamsDto<DownloadSourceDto> queryParams) => await repository.GetByPage(queryParams);
    public async Task<DownloadSourceDto> GetById(Guid id) => await repository.GetById(id);
    public async Task<DownloadSourceDto> Create(CreateDownloadSourceDto downloadSource) => await repository.Create(downloadSource);
    public async Task<DownloadSourceDto> Update(UpdateDownloadSourceDto downloadSource) => await repository.Update(downloadSource);
    public async Task Delete(Guid id) => await repository.Delete(id);
}