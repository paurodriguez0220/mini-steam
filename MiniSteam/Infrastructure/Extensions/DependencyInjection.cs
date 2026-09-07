using Microsoft.EntityFrameworkCore;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Dtos;
using MiniSteam.Domain.Entities;
using MiniSteam.Infrastructure.Data;
using MiniSteam.Infrastructure.Mappers;
using MiniSteam.Infrastructure.Repositories;
using MiniSteam.Infrastructure.Services;

namespace MiniSteam.Infrastructure.Extensions
{
    public static class DependencyInjection
    {
        private const string ConnectionStringName = "DefaultConnection";

        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString(ConnectionStringName);

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException(
                    $"Connection string '{ConnectionStringName}' is not configured. " +
                    "Set it with user-secrets locally (dotnet user-secrets set \"ConnectionStrings:DefaultConnection\" \"...\") " +
                    "or in App Service configuration when deployed.");
            }

            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure()));

            // Repositories
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            services.AddScoped<IService<Game, GameDto>, Service<Game, GameDto>>();
            services.AddScoped<IAuthService, AuthService>();

            // Mappers
            services.AddScoped<IMapper<Game, GameDto>, GameMapper>();

            return services;
        }
    }
}
