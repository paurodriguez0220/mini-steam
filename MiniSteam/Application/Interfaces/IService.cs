using MiniSteam.Domain.Entities;

namespace MiniSteam.Application.Interfaces
{
    public interface IService<TEntity, TDto> where TEntity : BaseEntity
    {
        Task<TDto?> GetAsync(int id);
        Task<List<TDto>> GetAllAsync();
        Task<TDto> CreateAsync(TDto dto);
        Task UpdateAsync(int id, TDto dto);
        Task DeleteAsync(int id);
    }
}