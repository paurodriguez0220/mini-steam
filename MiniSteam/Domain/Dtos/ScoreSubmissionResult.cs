namespace MiniSteam.Domain.Dtos
{
    /// <summary>
    /// Why a submission was or was not recorded.
    /// </summary>
    public enum ScoreSubmissionStatus
    {
        /// <summary>The score was written.</summary>
        Recorded,

        /// <summary>The submitted <c>gameId</c> does not exist.</summary>
        UnknownGame,

        /// <summary>The token is valid but the user it names no longer exists.</summary>
        UnknownUser
    }

    /// <summary>
    /// The outcome of a submission, so the caller can pick the right status code without the
    /// service having to know about HTTP.
    /// </summary>
    public sealed record ScoreSubmissionResult(ScoreSubmissionStatus Status, ScoreDto? Score)
    {
        public static ScoreSubmissionResult Recorded(ScoreDto score)
            => new(ScoreSubmissionStatus.Recorded, score);

        public static ScoreSubmissionResult UnknownGame()
            => new(ScoreSubmissionStatus.UnknownGame, null);

        public static ScoreSubmissionResult UnknownUser()
            => new(ScoreSubmissionStatus.UnknownUser, null);
    }
}
