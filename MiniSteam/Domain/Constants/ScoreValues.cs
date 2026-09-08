namespace MiniSteam.Domain.Constants
{
    /// <summary>
    /// The vocabulary a recorded score is written with.
    /// </summary>
    /// <remarks>
    /// These literals are the wire contract shared with the games and the storefront
    /// (<c>shared/game-score.ts</c>). They are compared and persisted exactly as written -
    /// lowercase, ordinal - so a mismatch is rejected rather than quietly coerced.
    /// </remarks>
    public static class ScoreValues
    {
        /// <summary>Longest token any of the vocabularies below can produce.</summary>
        public const int MaxTokenLength = 16;

        /// <summary>What the number in a score actually measures.</summary>
        public static class MetricKinds
        {
            public const string Points = "points";
            public const string Seconds = "seconds";

            public static readonly IReadOnlyList<string> All = new[] { Points, Seconds };
        }

        /// <summary>Which end of the scale wins.</summary>
        public static class Directions
        {
            public const string Higher = "higher";
            public const string Lower = "lower";

            public static readonly IReadOnlyList<string> All = new[] { Higher, Lower };
        }

        /// <summary>How the run ended.</summary>
        public static class Outcomes
        {
            public const string Won = "won";
            public const string Lost = "lost";

            public static readonly IReadOnlyList<string> All = new[] { Won, Lost };
        }

        /// <summary>Minesweeper is the only game that stratifies its board today.</summary>
        public static class Difficulties
        {
            public const string Easy = "easy";
            public const string Medium = "medium";
            public const string Hard = "hard";

            public static readonly IReadOnlyList<string> All = new[] { Easy, Medium, Hard };
        }

        /// <summary>
        /// The only direction a given metric kind may rank in: points accumulate upward,
        /// elapsed seconds are better when smaller.
        /// </summary>
        /// <returns>The required direction, or <c>null</c> when the metric kind is unknown.</returns>
        public static string? RequiredDirectionFor(string? metricKind) => metricKind switch
        {
            MetricKinds.Points => Directions.Higher,
            MetricKinds.Seconds => Directions.Lower,
            _ => null
        };
    }
}
