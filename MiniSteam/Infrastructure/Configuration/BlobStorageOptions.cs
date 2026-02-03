using System.ComponentModel.DataAnnotations;

namespace MiniSteam.Infrastructure.Configuration
{
    public class BlobStorageOptions
    {
        public const string SectionName = "AzureBlobStorage";

        [Required(ErrorMessage = "Azure Blob Storage connection string is required")]
        public string ConnectionString { get; set; } = string.Empty;

        [Required]
        public string GameIconsContainer { get; set; } = "game-icons";

        [Required]
        public string UserAvatarsContainer { get; set; } = "user-avatars";

        [Range(1, 100)]
        public int MaxFileSizeInMB { get; set; } = 5;

        [Required]
        [MinLength(1)]
        public string[] AllowedImageExtensions { get; set; } = new[] { ".jpg", ".jpeg", ".png", ".gif" };
    }
}