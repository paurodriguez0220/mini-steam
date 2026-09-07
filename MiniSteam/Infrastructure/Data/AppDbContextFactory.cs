using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MiniSteam.Infrastructure.Data
{
    /// <summary>
    /// Creates an <see cref="AppDbContext"/> for design-time tooling (dotnet ef).
    /// </summary>
    /// <remarks>
    /// Without this, EF builds the full application host to find the context, which means
    /// `dotnet ef migrations add` fails unless JWT and blob storage settings are present.
    /// Migrations only need the model and the provider, so this bypasses startup entirely.
    /// The database file here is never opened - scaffolding does not connect.
    /// </remarks>
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite("Data Source=design-time.db")
                .Options;

            return new AppDbContext(options);
        }
    }
}
