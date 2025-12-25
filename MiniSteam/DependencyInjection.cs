using Microsoft.EntityFrameworkCore;
using MiniSteam.Application.Interfaces;
using MiniSteam.Application.Services;
using MiniSteam.Infrastructure.Data;
using MiniSteam.Infrastructure.Repositories;

namespace MiniSteam
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection"); 
            services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));

            // Repositories
            services.AddScoped<IGameRepository, GameRepository>();

            // Services
            services.AddScoped<GameService>();

            return services;
        }
    }
}
