using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Dtos;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Infrastructure.Mappers
{
    public class ScoreMapper : IMapper<Score, ScoreDto>
    {
        public ScoreDto ToDto(Score entity)
        {
            return new ScoreDto
            {
                Id = entity.Id,
                GameId = entity.GameId,
                GameTitle = entity.Game?.Title ?? string.Empty,
                UserId = entity.UserId,
                PlayerName = ResolvePlayerName(entity.User),
                MetricKind = entity.MetricKind,
                Value = entity.Value,
                BetterIs = entity.BetterIs,
                Difficulty = entity.Difficulty,
                Outcome = entity.Outcome,
                AchievedAt = entity.AchievedAt
            };
        }

        public List<ScoreDto> ToDtoList(IEnumerable<Score> entities)
        {
            return entities.Select(ToDto).ToList();
        }

        public Score ToEntity(ScoreDto dto)
        {
            return new Score
            {
                GameId = dto.GameId,
                UserId = dto.UserId,
                MetricKind = dto.MetricKind,
                Value = dto.Value,
                BetterIs = dto.BetterIs,
                Difficulty = dto.Difficulty,
                Outcome = dto.Outcome,
                AchievedAt = dto.AchievedAt
            };
        }

        /// <summary>
        /// A score is a historical fact - only the difficulty label and the timestamp are
        /// ever corrected, never the measurement, the game or the player.
        /// </summary>
        public void UpdateEntity(Score entity, ScoreDto dto)
        {
            entity.Difficulty = dto.Difficulty;
            entity.AchievedAt = dto.AchievedAt;
        }

        /// <summary>
        /// Prefers the profile display name. The profile is optional in practice - the
        /// development seeder creates a user without one - so both hops are null-guarded.
        /// </summary>
        private static string ResolvePlayerName(User? user)
        {
            if (user is null)
            {
                return string.Empty;
            }

            var displayName = user.Profile?.DisplayName;

            return string.IsNullOrWhiteSpace(displayName) ? user.UserName : displayName;
        }
    }
}
