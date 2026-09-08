using MiniSteam.Domain.Entities;

namespace MiniSteam.Application.Interfaces
{
    /// <summary>
    /// Score persistence. Extends the generic repository with the two reads a leaderboard
    /// needs, so no LINQ is built outside the data layer.
    /// </summary>
    public interface IScoreRepository : IRepository<Score>
    {
        /// <summary>
        /// A single score with its game and player loaded, so it can be labelled without a
        /// second request.
        /// </summary>
        Task<Score?> GetDetailedAsync(int id, CancellationToken cancellationToken);

        /// <summary>
        /// The direction the given game's scores rank in, taken from the game's most recently
        /// achieved score.
        /// </summary>
        /// <remarks>
        /// Direction is a property of the metric, not of the request, so it is never taken
        /// from the caller. A game with no scores yet has no recorded direction.
        /// </remarks>
        /// <returns>"higher", "lower", or <c>null</c> when the game has no scores.</returns>
        Task<string?> GetRankingDirectionAsync(int gameId, CancellationToken cancellationToken);

        /// <summary>
        /// The best <paramref name="limit"/> scores for a game, ordered best-first for
        /// <paramref name="betterIs"/>.
        /// </summary>
        /// <param name="difficulty">Restrict to one difficulty, or null for every difficulty.</param>
        /// <param name="betterIs">"higher" ranks descending; "lower" ranks ascending.</param>
        Task<List<Score>> GetLeaderboardAsync(
            int gameId,
            string? difficulty,
            string betterIs,
            int limit,
            CancellationToken cancellationToken);
    }
}
