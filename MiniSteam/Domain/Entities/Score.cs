namespace MiniSteam.Domain.Entities
{
    /// <summary>
    /// One finished run of one game by one user.
    /// </summary>
    /// <remarks>
    /// The three games are not comparable to one another - Snake counts food, 2048 sums
    /// merged tiles and Minesweeper measures elapsed seconds where lower wins - so a score
    /// carries its own metric kind and its own ranking direction and is only ever ranked
    /// against other scores for the same game (and the same difficulty, where one exists).
    /// There is deliberately no normalised cross-game number.
    /// </remarks>
    public class Score : BaseEntity
    {
        public int GameId { get; set; }

        public int UserId { get; set; }

        /// <summary>"points" or "seconds" - see <c>ScoreValues.MetricKinds</c>.</summary>
        public required string MetricKind { get; set; }

        /// <summary>The measurement itself: a non-negative count of points or of seconds.</summary>
        public int Value { get; set; }

        /// <summary>"higher" or "lower" - see <c>ScoreValues.Directions</c>.</summary>
        public required string BetterIs { get; set; }

        /// <summary>"easy" / "medium" / "hard", or null for a game that has one board.</summary>
        public string? Difficulty { get; set; }

        /// <summary>"won" or "lost" - see <c>ScoreValues.Outcomes</c>.</summary>
        public required string Outcome { get; set; }

        /// <summary>When the run finished, stamped server-side in UTC.</summary>
        public DateTime AchievedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Game Game { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
