namespace MiniSteam.Domain.Dtos
{
    /// <summary>
    /// A recorded score, as returned to callers.
    /// </summary>
    public class ScoreDto
    {
        /// <summary>
        /// The unique identifier for the score
        /// </summary>
        /// <example>1</example>
        public int Id { get; set; }

        /// <summary>
        /// The game the run belongs to
        /// </summary>
        /// <example>3</example>
        public int GameId { get; set; }

        /// <summary>
        /// The game's title, so callers do not need a second request to label the row
        /// </summary>
        /// <example>Minesweeper</example>
        public string GameTitle { get; set; } = string.Empty;

        /// <summary>
        /// The user who achieved the score
        /// </summary>
        /// <example>1</example>
        public int UserId { get; set; }

        /// <summary>
        /// The user's display name, falling back to their username
        /// </summary>
        /// <example>paulo</example>
        public string PlayerName { get; set; } = string.Empty;

        /// <summary>
        /// What the value measures: "points" or "seconds"
        /// </summary>
        /// <example>seconds</example>
        public string MetricKind { get; set; } = string.Empty;

        /// <summary>
        /// The measurement: a non-negative count of points or of seconds
        /// </summary>
        /// <example>47</example>
        public int Value { get; set; }

        /// <summary>
        /// Which end of the scale wins: "higher" or "lower"
        /// </summary>
        /// <example>lower</example>
        public string BetterIs { get; set; } = string.Empty;

        /// <summary>
        /// The board difficulty, or null for a game that has a single board
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
