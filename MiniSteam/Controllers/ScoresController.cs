using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Constants;
using MiniSteam.Domain.Dtos;

namespace MiniSteam.Controllers
{
    /// <summary>
    /// Final scores and per-game leaderboards.
    /// </summary>
    /// <remarks>
    /// This controller does not inherit <see cref="GenericController{TEntity, TDto}"/>. The
    /// generic surface would publish <c>PUT /api/scores/{id}</c> and
    /// <c>DELETE /api/scores/{id}</c>, letting any signed-in caller rewrite or erase another
    /// player's result, plus an unfiltered <c>GET /api/scores</c> that dumps the whole table.
    /// A score is append-only, so only the operations below are exposed.
    /// </remarks>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ScoresController : ControllerBase
    {
        /// <summary>Rows returned when the caller does not ask for a specific number.</summary>
        public const int DefaultLeaderboardLimit = 10;

        /// <summary>Hard server-side ceiling on <c>limit</c>.</summary>
        public const int MaxLeaderboardLimit = 100;

        private readonly IScoreService _scoreService;
        private readonly ILogger<ScoresController> _logger;

        public ScoresController(IScoreService scoreService, ILogger<ScoresController> logger)
        {
            _scoreService = scoreService;
            _logger = logger;
        }

        /// <summary>
        /// Record a final score for the signed-in user.
        /// </summary>
        /// <remarks>
        /// The payload is the flattened <c>final</c> message from <c>shared/game-score.ts</c>.
        /// It is taken from the request body only - never from route or query parameters. The
        /// player is read from the bearer token and the achievement time is stamped
        /// server-side, so neither can be spoofed by the caller.
        /// </remarks>
        [HttpPost]
        [ProducesResponseType(typeof(ScoreDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ScoreDto>> Submit(
            [FromBody] ScoreSubmissionDto submission,
            CancellationToken cancellationToken)
        {
            if (ValidateSubmission(submission) is { } validationError)
            {
                return validationError;
            }

            if (!TryGetUserId(out var userId))
            {
                _logger.LogWarning("Score submission rejected: the token carries no usable user id.");
                return Unauthorized();
            }

            var result = await _scoreService.SubmitAsync(userId, submission, cancellationToken);

            switch (result.Status)
            {
                case ScoreSubmissionStatus.UnknownGame:
                    ModelState.AddModelError(
                        nameof(submission.GameId),
                        $"No game exists with id {submission.GameId}.");
                    return ValidationProblem(ModelState);

                case ScoreSubmissionStatus.UnknownUser:
                    _logger.LogWarning(
                        "Score submission rejected: user {UserId} from a valid token no longer exists.",
                        userId);
                    return Unauthorized();

                default:
                    var score = result.Score!;
                    return CreatedAtAction(nameof(Get), new { id = score.Id }, score);
            }
        }

        /// <summary>
        /// Read one recorded score.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ScoreDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ScoreDto>> Get(int id, CancellationToken cancellationToken)
        {
            var score = await _scoreService.GetAsync(id, cancellationToken);

            if (score is null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Score not found.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            return Ok(score);
        }

        /// <summary>
        /// The ranked board for one game.
        /// </summary>
        /// <remarks>
        /// Boards are per game, and per difficulty where the game has one - the three games
        /// measure different things and are never ranked against each other. Ordering follows
        /// the metric's own direction: descending for points, ascending for elapsed seconds.
        /// </remarks>
        /// <param name="gameId">The game to rank. Required.</param>
        /// <param name="difficulty">"easy", "medium" or "hard". Omit to include every difficulty.</param>
        /// <param name="limit">
        /// Rows to return, 1 to <see cref="MaxLeaderboardLimit"/>. Defaults to
        /// <see cref="DefaultLeaderboardLimit"/>.
        /// </param>
        [HttpGet("leaderboard")]
        [ProducesResponseType(typeof(LeaderboardDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<LeaderboardDto>> GetLeaderboard(
            [FromQuery, Range(1, int.MaxValue)] int gameId,
            [FromQuery] string? difficulty,
            [FromQuery, Range(1, MaxLeaderboardLimit)] int limit = DefaultLeaderboardLimit,
            CancellationToken cancellationToken = default)
        {
            if (difficulty is not null && !ScoreValues.Difficulties.All.Contains(difficulty))
            {
                ModelState.AddModelError(nameof(difficulty), AllowedValuesMessage(ScoreValues.Difficulties.All));
                return ValidationProblem(ModelState);
            }

            var leaderboard = await _scoreService.GetLeaderboardAsync(
                gameId, difficulty, limit, cancellationToken);

            if (leaderboard is null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Game not found.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            return Ok(leaderboard);
        }

        /// <summary>
        /// Checks the submitted vocabulary and the metric/direction pairing.
        /// Returns <c>null</c> when the submission is acceptable.
        /// </summary>
        /// <remarks>
        /// Presence and numeric range are already enforced by the data annotations on
        /// <see cref="ScoreSubmissionDto"/>, which <c>[ApiController]</c> turns into a
        /// ProblemDetails 400 before this action runs.
        /// </remarks>
        private ActionResult? ValidateSubmission(ScoreSubmissionDto submission)
        {
            if (!ScoreValues.MetricKinds.All.Contains(submission.MetricKind))
            {
                ModelState.AddModelError(
                    nameof(submission.MetricKind),
                    AllowedValuesMessage(ScoreValues.MetricKinds.All));
            }

            if (!ScoreValues.Directions.All.Contains(submission.BetterIs))
            {
                ModelState.AddModelError(
                    nameof(submission.BetterIs),
                    AllowedValuesMessage(ScoreValues.Directions.All));
            }

            if (!ScoreValues.Outcomes.All.Contains(submission.Outcome))
            {
                ModelState.AddModelError(
                    nameof(submission.Outcome),
                    AllowedValuesMessage(ScoreValues.Outcomes.All));
            }

            if (submission.Difficulty is not null
                && !ScoreValues.Difficulties.All.Contains(submission.Difficulty))
            {
                ModelState.AddModelError(
                    nameof(submission.Difficulty),
                    AllowedValuesMessage(ScoreValues.Difficulties.All));
            }

            // A metric only ranks one way. Accepting "seconds" that rank higher would put a
            // slow loss at the top of the board for good.
            var requiredDirection = ScoreValues.RequiredDirectionFor(submission.MetricKind);
            if (requiredDirection is not null && submission.BetterIs != requiredDirection)
            {
                ModelState.AddModelError(
                    nameof(submission.BetterIs),
                    $"A metric kind of '{submission.MetricKind}' must be submitted with " +
                    $"betterIs '{requiredDirection}'.");
            }

            return ModelState.IsValid ? null : ValidationProblem(ModelState);
        }

        private static string AllowedValuesMessage(IReadOnlyList<string> allowed)
            => $"Allowed values are: {string.Join(", ", allowed)}.";

        /// <summary>
        /// Reads the user id the token was issued for. Never trusts a caller-supplied id.
        /// </summary>
        private bool TryGetUserId(out int userId)
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(claim, out userId) && userId > 0;
        }
    }
}
