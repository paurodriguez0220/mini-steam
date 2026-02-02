using Microsoft.EntityFrameworkCore;
using MiniSteam.Application.Interfaces;
using MiniSteam.Infrastructure.Data;
using MiniSteam.Infrastructure.Repositories;

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
            services.AddScoped(typeof(IService<>), typeof(Service<>));
            services.AddScoped<IAuthService, AuthService>();

            return services;
        }
    }
}
