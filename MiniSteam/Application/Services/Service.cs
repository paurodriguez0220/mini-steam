using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Application.Services
{
    public class Service<T> : IService<T> where T : BaseEntity
    {
        private readonly IRepository<T> _repository;

        public Service(IRepository<T> repository)
        {
            _repository = repository;
        }

        public async Task<T?> GetAsync(int id)
            => await _repository.GetByIdAsync(id);

        public async Task<List<T>> GetAllAsync()
            => await _repository.GetAllAsync();

        public async Task<T> CreateAsync(T entity)
        {
            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();
            return entity;
        }

        public async Task UpdateAsync(T entity)
        {
            _repository.Update(entity);
            await _repository.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return;

            _repository.Delete(entity);
            await _repository.SaveChangesAsync();
        }
    }
}
