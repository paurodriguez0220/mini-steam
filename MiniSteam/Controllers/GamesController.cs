using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Entities;
using MiniSteam.Domain.Dtos;

namespace MiniSteam.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize]
    public class GamesController : GenericController<Game, GameDto>
    {
        private readonly IBlobStorageService _blobStorageService;
        private readonly IConfiguration _configuration;

        public GamesController(
            IService<Game, GameDto> service, 
            IBlobStorageService blobStorageService,
            IConfiguration configuration) : base(service)
        {
            _blobStorageService = blobStorageService;
            _configuration = configuration;
        }

        /// <summary>
        /// Upload a game icon image
        /// </summary>
        /// <param name="id">The game ID</param>
        /// <param name="file">The image file to upload</param>
        /// <returns>The updated game with the new icon path</returns>
        [HttpPost("{id}/upload-icon")]
        [ProducesResponseType(typeof(FileUploadResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<FileUploadResponse>> UploadGameIcon(int id, IFormFile file)
        {
            try
            {
                // Validate file
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "No file was uploaded." });
                }

                // Get configuration values
                var maxFileSizeInMB = _configuration.GetValue<int>("AzureBlobStorage:MaxFileSizeInMB", 5);
                var allowedExtensions = _configuration.GetSection("AzureBlobStorage:AllowedImageExtensions")
                    .Get<string[]>() ?? new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var containerName = _configuration["AzureBlobStorage:GameIconsContainer"] ?? "game-icons";

                // Validate file size
                var maxFileSizeInBytes = maxFileSizeInMB * 1024 * 1024;
                if (file.Length > maxFileSizeInBytes)
                {
                    return StatusCode(StatusCodes.Status413PayloadTooLarge, 
                        new { message = $"File size exceeds the maximum allowed size of {maxFileSizeInMB}MB." });
                }

                // Validate file extension
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { 
                        message = $"Invalid file type. Allowed extensions are: {string.Join(", ", allowedExtensions)}" 
                    });
                }

                // Check if game exists
                var existingGame = await _service.GetAsync(id);
                if (existingGame == null)
                {
                    return NotFound(new { message = $"Game with ID {id} not found." });
                }

                // Generate unique filename to avoid conflicts
                var uniqueFileName = $"game_{id}_{Guid.NewGuid()}{fileExtension}";

                // Upload file to blob storage
                var uploadedUrl = await _blobStorageService.UploadFileAsync(file, containerName, uniqueFileName);

                // Update the game's IconPath
                existingGame.IconPath = uploadedUrl;
                await _service.UpdateAsync(id, existingGame);

                return Ok(new FileUploadResponse
                { 
                    Message = "Game icon uploaded successfully.",
                    FileUrl = uploadedUrl,
                    FileName = uniqueFileName,
                    GameId = id,
                    Game = existingGame
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "An error occurred while uploading the image.", details = ex.Message });
            }
        }

        /// <summary>
        /// Upload a game icon image without specifying a game ID (for new games)
        /// </summary>
        /// <param name="file">The image file to upload</param>
        /// <returns>The URL of the uploaded image</returns>
        [HttpPost("upload-icon")]
        [ProducesResponseType(typeof(FileUploadResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<FileUploadResponse>> UploadGameIconStandalone(IFormFile file)
        {
            try
            {
                // Validate file
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "No file was uploaded." });
                }

                // Get configuration values
                var maxFileSizeInMB = _configuration.GetValue<int>("AzureBlobStorage:MaxFileSizeInMB", 5);
                var allowedExtensions = _configuration.GetSection("AzureBlobStorage:AllowedImageExtensions")
                    .Get<string[]>() ?? new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var containerName = _configuration["AzureBlobStorage:GameIconsContainer"] ?? "game-icons";

                // Validate file size
                var maxFileSizeInBytes = maxFileSizeInMB * 1024 * 1024;
                if (file.Length > maxFileSizeInBytes)
                {
                    return StatusCode(StatusCodes.Status413PayloadTooLarge, 
                        new { message = $"File size exceeds the maximum allowed size of {maxFileSizeInMB}MB." });
                }

                // Validate file extension
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { 
                        message = $"Invalid file type. Allowed extensions are: {string.Join(", ", allowedExtensions)}" 
                    });
                }

                // Generate unique filename
                var uniqueFileName = $"game_icon_{Guid.NewGuid()}{fileExtension}";

                // Upload file to blob storage
                var uploadedUrl = await _blobStorageService.UploadFileAsync(file, containerName, uniqueFileName);

                return Ok(new FileUploadResponse
                { 
                    Message = "Game icon uploaded successfully.",
                    FileUrl = uploadedUrl,
                    FileName = uniqueFileName
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "An error occurred while uploading the image.", details = ex.Message });
            }
        }

        /// <summary>
        /// Delete a game icon from blob storage
        /// </summary>
        /// <param name="id">The game ID</param>
        /// <returns>Success response</returns>
        [HttpDelete("{id}/icon")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> DeleteGameIcon(int id)
        {
            try
            {
                // Check if game exists
                var existingGame = await _service.GetAsync(id);
                if (existingGame == null)
                {
                    return NotFound(new { message = $"Game with ID {id} not found." });
                }

                // Check if game has an icon to delete
                if (string.IsNullOrEmpty(existingGame.IconPath))
                {
                    return BadRequest(new { message = "Game does not have an icon to delete." });
                }

                var containerName = _configuration["AzureBlobStorage:GameIconsContainer"] ?? "game-icons";

                // Delete from blob storage
                await _blobStorageService.DeleteFileAsync(existingGame.IconPath, containerName);

                // Update game to remove icon path
                existingGame.IconPath = string.Empty;
                await _service.UpdateAsync(id, existingGame);

                return Ok(new { message = "Game icon deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "An error occurred while deleting the icon.", details = ex.Message });
            }
        }
    }
}