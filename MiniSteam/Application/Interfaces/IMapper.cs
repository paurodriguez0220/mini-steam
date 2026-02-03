using MiniSteam.Domain.Entities;

namespace MiniSteam.Application.Interfaces
{
    public interface IMapper<TEntity, TDto> where TEntity : BaseEntity
    {
        TDto ToDto(TEntity entity);
        List<TDto> ToDtoList(IEnumerable<TEntity> entities);
        TEntity ToEntity(TDto dto);
        void UpdateEntity(TEntity entity, TDto dto);
    }
}