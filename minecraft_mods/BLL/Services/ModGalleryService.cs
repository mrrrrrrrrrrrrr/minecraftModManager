// BLL/Services/ModGalleryService.cs
using BLL.Interfaces;
using DAL.Interfaces;
using DTO.ModGallery;
using DTO.Shared;

namespace BLL.Services;

public class ModGalleryService(IRepository<ModGalleryDto, CreateModGalleryDto, UpdateModGalleryDto> repository) 
    : IService<ModGalleryDto, CreateModGalleryDto, UpdateModGalleryDto>
{
    public async Task<List<ModGalleryDto>> GetAll() => await repository.GetAll();
    public async Task<QueryParamsDto<ModGalleryDto>> GetByPage(QueryParamsDto<ModGalleryDto> queryParams) => await repository.GetByPage(queryParams);
    public async Task<ModGalleryDto> GetById(Guid id) => await repository.GetById(id);
    public async Task<ModGalleryDto> Create(CreateModGalleryDto gallery) => await repository.Create(gallery);
    public async Task<ModGalleryDto> Update(UpdateModGalleryDto gallery) => await repository.Update(gallery);
    public async Task Delete(Guid id) => await repository.Delete(id);
}