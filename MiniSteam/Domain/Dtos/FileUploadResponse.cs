namespace MiniSteam.Domain.Dtos
{
    /// <summary>
    /// Response model for file upload operations
    /// </summary>
    public class FileUploadResponse
    {
        /// <summary>
        /// Success message
        /// </summary>
        /// <example>Game icon uploaded successfully.</example>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// The URL of the uploaded file
        /// </summary>
        /// <example>https://stportfoliogamesdev.blob.core.windows.net/game-icons/game_1_abc123.png</example>
        public string FileUrl { get; set; } = string.Empty;

        /// <summary>
        /// The filename assigned to the uploaded file
        /// </summary>
        /// <example>game_1_abc123.png</example>
        public string FileName { get; set; } = string.Empty;

        /// <summary>
        /// The game ID if associated with a specific game
        /// </summary>
        /// <example>1</example>
        public int? GameId { get; set; }

        /// <summary>
        /// The updated game object if applicable
        /// </summary>
        public GameDto? Game { get; set; }
    }
}