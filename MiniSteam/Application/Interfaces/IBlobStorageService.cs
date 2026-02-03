using Microsoft.AspNetCore.Http;

namespace MiniSteam.Application.Interfaces
{
    public interface IBlobStorageService
    {
        /// <summary>
        /// Uploads a file to blob storage
        /// </summary>
        /// <param name="file">The file to upload</param>
        /// <param name="containerName">The container name in blob storage</param>
        /// <returns>The URL of the uploaded file</returns>
        Task<string> UploadFileAsync(IFormFile file, string containerName);

        /// <summary>
        /// Uploads a file with a custom filename to blob storage
        /// </summary>
        /// <param name="file">The file to upload</param>
        /// <param name="containerName">The container name in blob storage</param>
        /// <param name="fileName">Custom filename for the blob</param>
        /// <returns>The URL of the uploaded file</returns>
        Task<string> UploadFileAsync(IFormFile file, string containerName, string fileName);

        /// <summary>
        /// Deletes a file from blob storage
        /// </summary>
        /// <param name="blobUrl">The URL of the blob to delete</param>
        /// <param name="containerName">The container name in blob storage</param>
        Task DeleteFileAsync(string blobUrl, string containerName);

        /// <summary>
        /// Deletes a file by its blob name
        /// </summary>
        /// <param name="blobName">The name of the blob to delete</param>
        /// <param name="containerName">The container name in blob storage</param>
        Task DeleteFileByNameAsync(string blobName, string containerName);

        /// <summary>
        /// Gets the URL of a blob
        /// </summary>
        /// <param name="blobName">The name of the blob</param>
        /// <param name="containerName">The container name in blob storage</param>
        /// <returns>The URL of the blob</returns>
        string GetBlobUrl(string blobName, string containerName);

        /// <summary>
        /// Checks if a blob exists
        /// </summary>
        /// <param name="blobName">The name of the blob</param>
        /// <param name="containerName">The container name in blob storage</param>
        /// <returns>True if the blob exists, false otherwise</returns>
        Task<bool> BlobExistsAsync(string blobName, string containerName);
    }
}