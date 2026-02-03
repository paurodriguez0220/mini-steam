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
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = "Server=tcp:sql-portfolio-server-dev.database.windows.net,1433;Initial Catalog=gamesappdb;Persist Security Info=False;User ID=portfolioAdmin;Password=G@meP0rtf0l!o2025;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"; 
            services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));

            // Repositories
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            services.AddScoped<IMapper<Game, GameDto>, GameMapper>();
            services.AddScoped<IService<Game, GameDto>, Service<Game, GameDto>>();
            services.AddScoped<IAuthService, AuthService>();

            // Mappers
            services.AddScoped<IMapper<Game, GameDto>, GameMapper>();

            return services;
        }
    }
}
