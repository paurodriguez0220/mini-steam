using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Dtos;
using MiniSteam.Domain.Entities;
using MiniSteam.Infrastructure.Configuration;

namespace MiniSteam.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GamesController : GenericController<Game, GameDto>
    {
        private readonly IBlobStorageService _blobStorageService;
        private readonly BlobStorageOptions _options;

        public GamesController(
            IService<Game, GameDto> service,
            IBlobStorageService blobStorageService,
            IOptions<BlobStorageOptions> options) : base(service)
        {
            _blobStorageService = blobStorageService;
            _options = options.Value;
        }

        /// <summary>
        /// Upload an icon for an existing game and attach it to that game.
        /// </summary>
        [HttpPost("{id}/upload-icon")]
        [ProducesResponseType(typeof(FileUploadResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<FileUploadResponse>> UploadGameIcon(int id, IFormFile file)
        {
            if (ValidateUpload(file) is { } validationError)
            {
                return validationError;
            }

            var existingGame = await _service.GetAsync(id);
            if (existingGame == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Game not found.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var uniqueFileName = $"game_{id}_{Guid.NewGuid()}{fileExtension}";

            var uploadedUrl = await _blobStorageService.UploadFileAsync(
                file, _options.GameIconsContainer, uniqueFileName);

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

        /// <summary>
        /// Upload a game icon that is not yet attached to a game, for use when creating one.
        /// </summary>
        [HttpPost("upload-icon")]
        [ProducesResponseType(typeof(FileUploadResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<FileUploadResponse>> UploadGameIconStandalone(IFormFile file)
        {
            if (ValidateUpload(file) is { } validationError)
            {
                return validationError;
            }

            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var uniqueFileName = $"game_icon_{Guid.NewGuid()}{fileExtension}";

            var uploadedUrl = await _blobStorageService.UploadFileAsync(
                file, _options.GameIconsContainer, uniqueFileName);

            return Ok(new FileUploadResponse
            {
                Message = "Game icon uploaded successfully.",
                FileUrl = uploadedUrl,
                FileName = uniqueFileName
            });
        }

        /// <summary>
        /// Remove a game's icon from blob storage and clear it on the game.
        /// </summary>
        [HttpDelete("{id}/icon")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> DeleteGameIcon(int id)
        {
            var existingGame = await _service.GetAsync(id);
            if (existingGame == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Game not found.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            if (string.IsNullOrEmpty(existingGame.IconPath))
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Game does not have an icon to delete.",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            await _blobStorageService.DeleteFileAsync(existingGame.IconPath, _options.GameIconsContainer);

            existingGame.IconPath = string.Empty;
            await _service.UpdateAsync(id, existingGame);

            return NoContent();
        }

        /// <summary>
        /// Validates presence, size and extension of an uploaded image.
        /// Returns <c>null</c> when the file is acceptable.
        /// </summary>
        private ObjectResult? ValidateUpload(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "No file was uploaded.",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var maxFileSizeInBytes = (long)_options.MaxFileSizeInMB * 1024 * 1024;
            if (file.Length > maxFileSizeInBytes)
            {
                return StatusCode(StatusCodes.Status413PayloadTooLarge, new ProblemDetails
                {
                    Title = $"File size exceeds the maximum allowed size of {_options.MaxFileSizeInMB}MB.",
                    Status = StatusCodes.Status413PayloadTooLarge
                });
            }

            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_options.AllowedImageExtensions.Contains(fileExtension))
            {
                return BadRequest(new ProblemDetails
                {
                    Title = $"Invalid file type. Allowed extensions are: {string.Join(", ", _options.AllowedImageExtensions)}",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            return null;
        }
    }
}
