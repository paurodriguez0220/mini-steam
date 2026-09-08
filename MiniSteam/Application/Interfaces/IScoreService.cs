using MiniSteam.Domain.Dtos;

namespace MiniSteam.Application.Interfaces
{
    /// <summary>
    /// Recording and reading final scores.
    /// </summary>
    public interface IScoreService
    {
        /// <summary>
        /// Records a final score for the authenticated user, stamping the achievement time
        /// server-side.
        /// </summary>
        /// <remarks>
        /// The submission's vocabulary is validated by the caller; this method verifies the
        /// referenced game and user still exist.
        /// </remarks>
        Task<ScoreSubmissionResult> SubmitAsync(
            int userId,
            ScoreSubmissionDto submission,
            CancellationToken cancellationToken);

        /// <summary>Reads a single recorded score.</summary>
        Task<ScoreDto?> GetAsync(int id, CancellationToken cancellationToken);

        /// <summary>
        /// Builds the ranked board for one game, optionally narrowed to one difficulty.
        /// </summary>
        /// <returns><c>null</c> when the game does not exist.</returns>
        Task<LeaderboardDto?> GetLeaderboardAsync(
            int gameId,
            string? difficulty,
            int limit,
            CancellationToken cancellationToken);
    }
}
