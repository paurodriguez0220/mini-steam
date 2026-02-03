using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using MiniSteam.Application.Interfaces;

namespace MiniSteam.Infrastructure.Services
{
    public class BlobStorageService : IBlobStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;

        public BlobStorageService(string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
                throw new ArgumentException("Blob storage connection string cannot be null or empty", nameof(connectionString));

            _blobServiceClient = new BlobServiceClient(connectionString);
        }

        public async Task<string> UploadFileAsync(IFormFile file, string containerName)
        {
            var extension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{extension}";
            return await UploadFileAsync(file, containerName, fileName);
        }

        public async Task<string> UploadFileAsync(IFormFile file, string containerName, string fileName)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File cannot be null or empty", nameof(file));

            if (string.IsNullOrWhiteSpace(containerName))
                throw new ArgumentException("Container name cannot be null or empty", nameof(containerName));

            if (string.IsNullOrWhiteSpace(fileName))
                throw new ArgumentException("File name cannot be null or empty", nameof(fileName));

            // Get or create container
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName.ToLower());
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

            // Get blob client
            var blobClient = containerClient.GetBlobClient(fileName);

            // Set content type
            var blobHttpHeaders = new BlobHttpHeaders
            {
                ContentType = file.ContentType
            };

            // Upload file
            using (var stream = file.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, new BlobUploadOptions
                {
                    HttpHeaders = blobHttpHeaders
                });
            }

            return blobClient.Uri.ToString();
        }

        public async Task DeleteFileAsync(string blobUrl, string containerName)
        {
            if (string.IsNullOrWhiteSpace(blobUrl))
                throw new ArgumentException("Blob URL cannot be null or empty", nameof(blobUrl));

            var uri = new Uri(blobUrl);
            var blobName = Path.GetFileName(uri.LocalPath);

            await DeleteFileByNameAsync(blobName, containerName);
        }

        public async Task DeleteFileByNameAsync(string blobName, string containerName)
        {
            if (string.IsNullOrWhiteSpace(blobName))
                throw new ArgumentException("Blob name cannot be null or empty", nameof(blobName));

            if (string.IsNullOrWhiteSpace(containerName))
                throw new ArgumentException("Container name cannot be null or empty", nameof(containerName));

            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName.ToLower());
            var blobClient = containerClient.GetBlobClient(blobName);

            await blobClient.DeleteIfExistsAsync();
        }

        public string GetBlobUrl(string blobName, string containerName)
        {
            if (string.IsNullOrWhiteSpace(blobName))
                throw new ArgumentException("Blob name cannot be null or empty", nameof(blobName));

            if (string.IsNullOrWhiteSpace(containerName))
                throw new ArgumentException("Container name cannot be null or empty", nameof(containerName));

            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName.ToLower());
            var blobClient = containerClient.GetBlobClient(blobName);

            return blobClient.Uri.ToString();
        }

        public async Task<bool> BlobExistsAsync(string blobName, string containerName)
        {
            if (string.IsNullOrWhiteSpace(blobName))
                throw new ArgumentException("Blob name cannot be null or empty", nameof(blobName));

            if (string.IsNullOrWhiteSpace(containerName))
                throw new ArgumentException("Container name cannot be null or empty", nameof(containerName));

            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName.ToLower());
            var blobClient = containerClient.GetBlobClient(blobName);

            return await blobClient.ExistsAsync();
        }
    }
}