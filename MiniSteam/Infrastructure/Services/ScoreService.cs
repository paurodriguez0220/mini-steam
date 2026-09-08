using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Constants;
using MiniSteam.Domain.Dtos;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Infrastructure.Services
{
    /// <summary>
    /// Records final scores and builds per-game leaderboards.
    /// </summary>
    /// <remarks>
    /// Scores are deliberately not served through the generic <c>Service&lt;,&gt;</c>: a score
    /// is an append-only historical fact, and ranking it needs ordering and filtering the
    /// generic CRUD surface cannot express.
    /// </remarks>
    public class ScoreService : IScoreService
    {
        private readonly IScoreRepository _scoreRepository;
        private readonly IRepository<Game> _gameRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IMapper<Score, ScoreDto> _mapper;

        public ScoreService(
            IScoreRepository scoreRepository,
            IRepository<Game> gameRepository,
            IRepository<User> userRepository,
            IMapper<Score, ScoreDto> mapper)
        {
            _scoreRepository = scoreRepository;
            _gameRepository = gameRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<ScoreSubmissionResult> SubmitAsync(
            int userId,
            ScoreSubmissionDto submission,
            CancellationToken cancellationToken)
        {
            var game = await _gameRepository.GetByIdAsync(submission.GameId);
            if (game is null)
            {
                return ScoreSubmissionResult.UnknownGame();
            }

            // A token outlives the row it names; without this the insert would fail on the
            // foreign key and surface as a 500.
            var user = await _userRepository.GetByIdAsync(userId);
            if (user is null)
            {
                return ScoreSubmissionResult.UnknownUser();
            }

            var score = new Score
            {
                GameId = game.Id,
                UserId = user.Id,
                MetricKind = submission.MetricKind,
                Value = submission.Value,
                BetterIs = submission.BetterIs,
                Difficulty = submission.Difficulty,
                Outcome = submission.Outcome,
                // The caller does not get to date its own achievement.
                AchievedAt = DateTime.UtcNow,
                Game = game,
                User = user
            };

            await _scoreRepository.AddAsync(score);
            await _scoreRepository.SaveChangesAsync();

            return ScoreSubmissionResult.Recorded(_mapper.ToDto(score));
        }

        public async Task<ScoreDto?> GetAsync(int id, CancellationToken cancellationToken)
        {
            var score = await _scoreRepository.GetDetailedAsync(id, cancellationToken);

            return score is null ? null : _mapper.ToDto(score);
        }

        public async Task<LeaderboardDto?> GetLeaderboardAsync(
            int gameId,
            string? difficulty,
            int limit,
            CancellationToken cancellationToken)
        {
            var game = await _gameRepository.GetByIdAsync(gameId);
            if (game is null)
            {
                return null;
            }

            // An empty board still has to declare a direction; "higher" is the majority case
            // and is only ever used when there is nothing to rank.
            var betterIs = await _scoreRepository.GetRankingDirectionAsync(gameId, cancellationToken)
                ?? ScoreValues.Directions.Higher;

            var scores = await _scoreRepository.GetLeaderboardAsync(
                gameId, difficulty, betterIs, limit, cancellationToken);

            var entries = _mapper.ToDtoList(scores)
                .Select((score, index) => new LeaderboardEntryDto
                {
                    Rank = index + 1,
                    ScoreId = score.Id,
                    UserId = score.UserId,
                    PlayerName = score.PlayerName,
                    Value = score.Value,
                    Difficulty = score.Difficulty,
                    Outcome = score.Outcome,
                    AchievedAt = score.AchievedAt
                })
                .ToList();

            return new LeaderboardDto
            {
                GameId = game.Id,
                GameTitle = game.Title,
                MetricKind = scores.Count > 0 ? scores[0].MetricKind : null,
                BetterIs = betterIs,
                Difficulty = difficulty,
                Limit = limit,
                Entries = entries
            };
        }
    }
}
