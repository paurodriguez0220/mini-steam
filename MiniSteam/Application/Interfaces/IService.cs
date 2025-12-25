using MiniSteam.Domain.Entities;

namespace MiniSteam.Application.Interfaces
{
    public interface IService<T> where T : BaseEntity
    {
        Task<T?> GetAsync(int id);
        Task<List<T>> GetAllAsync();
        Task<T> CreateAsync(T entity);
        Task UpdateAsync(T entity);
        Task DeleteAsync(int id);
    }
}
