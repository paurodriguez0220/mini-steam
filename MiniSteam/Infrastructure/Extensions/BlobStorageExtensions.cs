using MiniSteam.Application.Interfaces;
using MiniSteam.Infrastructure.Configuration;
using MiniSteam.Infrastructure.Services;

namespace MiniSteam.Infrastructure.Extensions
{
    public static class BlobStorageExtensions
    {
        public static IServiceCollection AddBlobStorage(this IServiceCollection services, IConfiguration configuration)
        {
            // Configure BlobStorageOptions from appsettings
            services.Configure<BlobStorageOptions>(
                configuration.GetSection(BlobStorageOptions.SectionName));

            // Register BlobStorageService
            services.AddScoped<IBlobStorageService>(provider =>
            {
                var connectionString = configuration.GetValue<string>("AzureBlobStorage:ConnectionString");

                if (string.IsNullOrWhiteSpace(connectionString))
                    throw new InvalidOperationException("Azure Blob Storage connection string is not configured in appsettings.json");

                return new BlobStorageService(connectionString);
            });

            return services;
        }
    }
}