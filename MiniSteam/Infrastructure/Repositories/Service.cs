using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Infrastructure.Services
{
    public class Service<TEntity, TDto> : IService<TEntity, TDto>
        where TEntity : BaseEntity
    {
        private readonly IRepository<TEntity> _repository;
        private readonly IMapper<TEntity, TDto> _mapper;

        public Service(IRepository<TEntity> repository, IMapper<TEntity, TDto> mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<TDto?> GetAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            return entity == null ? default : _mapper.ToDto(entity);
        }

        public async Task<List<TDto>> GetAllAsync()
        {
            var entities = await _repository.GetAllAsync();
            return _mapper.ToDtoList(entities);
        }

        public async Task<TDto> CreateAsync(TDto dto)
        {
            var entity = _mapper.ToEntity(dto);
            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();
            return _mapper.ToDto(entity);
        }

        public async Task UpdateAsync(int id, TDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return;

            _mapper.UpdateEntity(entity, dto);
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