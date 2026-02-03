namespace MiniSteam.Domain.Dtos
{
    /// <summary>
    /// Represents a game in the MiniSteam platform
    /// </summary>
    public class GameDto
    {
        /// <summary>
        /// The unique identifier for the game
        /// </summary>
        /// <example>1</example>
        public int Id { get; set; }

        /// <summary>
        /// The title of the game
        /// </summary>
        /// <example>Portal 2</example>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// A detailed description of the game
        /// </summary>
        /// <example>A mind-bending puzzle platformer with co-op gameplay</example>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// The URL to the game's store page or website
        /// </summary>
        /// <example>https://store.steampowered.com/app/620</example>
        public string Url { get; set; } = string.Empty;

        /// <summary>
        /// The path to the game's icon image
        /// </summary>
        /// <example>/images/icons/portal2.png</example>
        public string IconPath { get; set; } = string.Empty;

        /// <summary>
        /// The category or genre of the game
        /// </summary>
        /// <example>Puzzle</example>
        public string Category { get; set; } = string.Empty;
    }
}