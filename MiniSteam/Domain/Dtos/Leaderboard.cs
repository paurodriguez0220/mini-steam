namespace MiniSteam.Domain.Dtos
{
    /// <summary>
    /// A ranked board for one game, and optionally one difficulty.
    /// </summary>
    /// <remarks>
    /// The envelope repeats the metric kind and the ranking direction because the storefront
    /// needs them to label and format the column - seconds render as <c>1:07</c>, points as
    /// <c>2,048</c> - and because ranking rules differ per game.
    /// </remarks>
    public class LeaderboardDto
    {
        /// <summary>
        /// The game the board belongs to
        /// </summary>
        /// <example>3</example>
        public int GameId { get; set; }

        /// <summary>
        /// The game's title
        /// </summary>
        /// <example>Minesweeper</example>
        public string GameTitle { get; set; } = string.Empty;

        /// <summary>
        /// What the values measure ("points" or "seconds"), or null when no score exists yet
        /// </summary>
        /// <example>seconds</example>
        public string? MetricKind { get; set; }

        /// <summary>
        /// The direction the board is ranked in: "higher" or "lower"
        /// </summary>
        /// <example>lower</example>
        public string BetterIs { get; set; } = string.Empty;

        /// <summary>
        /// The difficulty the board was filtered to, or null when all difficulties are included
        /// </summary>
        /// <example>hard</example>
        public string? Difficulty { get; set; }

        /// <summary>
        /// The maximum number of entries this response could contain
        /// </summary>
        /// <example>10</example>
        public int Limit { get; set; }

        /// <summary>
        /// The ranked entries, best first. Empty when the game has no scores yet.
        /// </summary>
        public List<LeaderboardEntryDto> Entries { get; set; } = new();
    }

    /// <summary>
    /// One row of a <see cref="LeaderboardDto"/>.
    /// </summary>
    public class LeaderboardEntryDto
    {
        /// <summary>
        /// The row's position, starting at 1. Equal values are still ranked in order.
        /// </summary>
        /// <example>1</example>
        public int Rank { get; set; }

        /// <summary>
        /// The identifier of the underlying score
        /// </summary>
        /// <example>42</example>
        public int ScoreId { get; set; }

        /// <summary>
        /// The user who achieved it
        /// </summary>
        /// <example>1</example>
        public int UserId { get; set; }

        /// <summary>
        /// The user's display name, falling back to their username
        /// </summary>
        /// <example>paulo</example>
        public string PlayerName { get; set; } = string.Empty;

        /// <summary>
        /// The measurement
        /// </summary>
        /// <example>47</example>
        public int Value { get; set; }

        /// <summary>
        /// The board difficulty, or null for a game with a single board
        /// </summary>
        /// <example>hard</example>
        public string? Difficulty { get; set; }

        /// <summary>
        /// How the run ended: "won" or "lost"
        /// </summary>
        /// <example>won</example>
        public string Outcome { get; set; } = string.Empty;

        /// <summary>
        /// When the run finished, in UTC
        /// </summary>
        /// <example>2026-09-08T10:30:00Z</example>
        public DateTime AchievedAt { get; set; }
    }
}
