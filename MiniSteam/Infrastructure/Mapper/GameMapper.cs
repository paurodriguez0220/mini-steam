using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Dtos;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Infrastructure.Mappers
{
    public class GameMapper : IMapper<Game, GameDto>
    {
        public GameDto ToDto(Game entity)
        {
            return new GameDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Description = entity.Description,
                Url = entity.Url,
                IconPath = entity.IconPath,
                Category = entity.Category
            };
        }

        public List<GameDto> ToDtoList(IEnumerable<Game> entities)
        {
            return entities.Select(ToDto).ToList();
        }

        public Game ToEntity(GameDto dto)
        {
            return new Game
            {
                Title = dto.Title,
                Description = dto.Description,
                Url = dto.Url,
                IconPath = dto.IconPath,
                Category = dto.Category
            };
        }

        public void UpdateEntity(Game entity, GameDto dto)
        {
            entity.Title = dto.Title;
            entity.Description = dto.Description;
            entity.Url = dto.Url;
            entity.IconPath = dto.IconPath;
            entity.Category = dto.Category;
        }
    }
}