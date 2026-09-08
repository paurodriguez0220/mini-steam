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
        private const string DefaultDatabaseFileName = "ministeam.db";

        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = ResolveConnectionString(configuration);

            services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

            // Repositories
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            services.AddScoped<IScoreRepository, ScoreRepository>();
            services.AddScoped<IService<Game, GameDto>, Service<Game, GameDto>>();
            services.AddScoped<IAuthService, AuthService>();

            // Scores are append-only and ranked per game, so they get a dedicated service
            // rather than the generic CRUD one - see ScoresController for what that would
            // otherwise expose.
            services.AddScoped<IScoreService, ScoreService>();

            // Mappers
            services.AddScoped<IMapper<Game, GameDto>, GameMapper>();
            services.AddScoped<IMapper<Score, ScoreDto>, ScoreMapper>();

            return services;
        }

        /// <summary>
        /// Returns the configured connection string, defaulting to a database file next to
        /// the application binaries.
        /// </summary>
        /// <remarks>
        /// A relative SQLite path is resolved against the current working directory, which
        /// differs between `dotnet run`, a published build and a container. Anchoring to
        /// <see cref="AppContext.BaseDirectory"/> keeps every host pointing at one file.
        /// </remarks>
        private static string ResolveConnectionString(IConfiguration configuration)
        {
            var configured = configuration.GetConnectionString(ConnectionStringName);

            if (string.IsNullOrWhiteSpace(configured))
            {
                var defaultPath = Path.Combine(AppContext.BaseDirectory, DefaultDatabaseFileName);
                return $"Data Source={defaultPath}";
            }

            var builder = new Microsoft.Data.Sqlite.SqliteConnectionStringBuilder(configured);

            if (!string.IsNullOrWhiteSpace(builder.DataSource) && !Path.IsPathRooted(builder.DataSource))
            {
                builder.DataSource = Path.Combine(AppContext.BaseDirectory, builder.DataSource);
            }

            return builder.ToString();
        }
    }
}
