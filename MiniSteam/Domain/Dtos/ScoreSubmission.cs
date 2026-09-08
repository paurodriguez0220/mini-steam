using System.ComponentModel.DataAnnotations;

namespace MiniSteam.Domain.Dtos
{
    /// <summary>
    /// A final score being recorded.
    /// </summary>
    /// <remarks>
    /// This is the flattened form of the <c>final</c> message defined in
    /// <c>shared/game-score.ts</c>: the message's nested <c>metric</c> object is lifted onto
    /// the request as <see cref="MetricKind"/>, <see cref="Value"/> and <see cref="BetterIs"/>.
    /// The game is identified by its database id rather than its slug, so the row is a real
    /// foreign key instead of a duplicated name.
    /// <para>
    /// The user is taken from the bearer token and the timestamp is stamped server-side -
    /// neither is accepted from the caller.
    /// </para>
    /// </remarks>
    public class ScoreSubmissionDto
    {
        /// <summary>
        /// The game the run belongs to
        /// </summary>
        /// <example>3</example>
        [Range(1, int.MaxValue, ErrorMessage = "GameId must be a positive game identifier.")]
        public int GameId { get; set; }

        /// <summary>
        /// What the value measures: "points" or "seconds"
        /// </summary>
        /// <example>seconds</example>
        [Required]
        public string MetricKind { get; set; } = string.Empty;

        /// <summary>
        /// The measurement: a non-negative count of points or of seconds
        /// </summary>
        /// <example>47</example>
        [Range(0, int.MaxValue, ErrorMessage = "Value must be a non-negative whole number.")]
        public int Value { get; set; }

        /// <summary>
        /// Which end of the scale wins: "higher" for points, "lower" for seconds
        /// </summary>
        /// <example>lower</example>
        [Required]
        public string BetterIs { get; set; } = string.Empty;

        /// <summary>
        /// The board difficulty ("easy" / "medium" / "hard"), omitted by games with a single board
        /// </summary>
        /// <example>hard</example>
        public string? Difficulty { get; set; }

        /// <summary>
        /// How the run ended: "won" or "lost"
        /// </summary>
        /// <example>won</example>
        [Required]
        public string Outcome { get; set; } = string.Empty;
    }
}
