using Microsoft.EntityFrameworkCore;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Constants;
using MiniSteam.Domain.Entities;
using MiniSteam.Infrastructure.Data;

namespace MiniSteam.Infrastructure.Repositories
{
    public class ScoreRepository : Repository<Score>, IScoreRepository
    {
        public ScoreRepository(AppDbContext context) : base(context) { }

        public async Task<Score?> GetDetailedAsync(int id, CancellationToken cancellationToken)
            => await WithRelations(_dbSet.AsNoTracking())
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        public async Task<string?> GetRankingDirectionAsync(int gameId, CancellationToken cancellationToken)
            => await _dbSet
                .AsNoTracking()
                .Where(s => s.GameId == gameId)
                .OrderByDescending(s => s.AchievedAt)
                .Select(s => s.BetterIs)
                .FirstOrDefaultAsync(cancellationToken);

        public async Task<List<Score>> GetLeaderboardAsync(
            int gameId,
            string? difficulty,
            string betterIs,
            int limit,
            CancellationToken cancellationToken)
        {
            var query = WithRelations(_dbSet.AsNoTracking())
                .Where(s => s.GameId == gameId);

            if (!string.IsNullOrWhiteSpace(difficulty))
            {
                query = query.Where(s => s.Difficulty == difficulty);
            }

            var isLowerBetter = betterIs == ScoreValues.Directions.Lower;

            if (isLowerBetter)
            {
                // On an ascending board a lost run is the fastest possible entry - stepping on
                // a mine after three seconds would outrank every real win - so only completed
                // runs are ranked. Games that rank upward can never lose their board this way,
                // and 2048 and Snake only ever end in a loss, so their runs all count.
                query = query.Where(s => s.Outcome == ScoreValues.Outcomes.Won);
            }

            // The earlier achievement wins a tie.
            query = isLowerBetter
                ? query.OrderBy(s => s.Value).ThenBy(s => s.AchievedAt)
                : query.OrderByDescending(s => s.Value).ThenBy(s => s.AchievedAt);

            return await query.Take(limit).ToListAsync(cancellationToken);
        }

        /// <summary>
        /// Eager-loads the game and the player. Lazy loading is not enabled, so a board built
        /// without these would silently render blank titles and names.
        /// </summary>
        private static IQueryable<Score> WithRelations(IQueryable<Score> query)
            => query
                .Include(s => s.Game)
                .Include(s => s.User)
                    .ThenInclude(u => u.Profile);
    }
}
