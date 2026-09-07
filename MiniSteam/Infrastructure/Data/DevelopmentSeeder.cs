using Microsoft.EntityFrameworkCore;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Infrastructure.Data
{
    /// <summary>
    /// Applies migrations and inserts the minimum data needed for a usable local stack:
    /// one sign-in account and the three bundled games.
    /// </summary>
    /// <remarks>
    /// Development only. Production migrations are deliberate and reviewed - never applied
    /// automatically on startup.
    /// </remarks>
    public static class DevelopmentSeeder
    {
        public static async Task MigrateAndSeedAsync(this WebApplication app)
        {
            if (!app.Environment.IsDevelopment())
            {
                return;
            }

            using var scope = app.Services.CreateScope();
            var services = scope.ServiceProvider;
            var logger = services.GetRequiredService<ILogger<Program>>();
            var db = services.GetRequiredService<AppDbContext>();
            var config = services.GetRequiredService<IConfiguration>();

            logger.LogInformation("Applying migrations...");
            await db.Database.MigrateAsync();

            await SeedUserAsync(db, config, logger);
            await SeedGamesAsync(db, config, logger);

            await db.SaveChangesAsync();
            logger.LogInformation("Development seed complete.");
        }

        private static async Task SeedUserAsync(AppDbContext db, IConfiguration config, ILogger logger)
        {
            var email = config["Seed:UserEmail"];
            var password = config["Seed:UserPassword"];

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                logger.LogInformation("Seed:UserEmail / Seed:UserPassword not set - skipping user seed.");
                return;
            }

            if (await db.Users.AnyAsync(u => u.Email == email))
            {
                return;
            }

            db.Users.Add(new User
            {
                UserName = email.Split('@')[0],
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                EmailConfirmed = true
            });

            logger.LogInformation("Seeded development user {Email}", email);
        }

        private static async Task SeedGamesAsync(AppDbContext db, IConfiguration config, ILogger logger)
        {
            // Each game is served by its own container; the browser loads these URLs in an
            // iframe, so they must be reachable from the host, not from inside the network.
            var games = new[]
            {
                new Game
                {
                    Title = "2048",
                    Description = "Slide the tiles and combine matching numbers to reach 2048.",
                    Url = config["Seed:GameUrls:2048"] ?? "http://localhost:5174",
                    IconPath = string.Empty,
                    Category = "Puzzle"
                },
                new Game
                {
                    Title = "Snake",
                    Description = "Eat, grow, and try not to run into yourself.",
                    Url = config["Seed:GameUrls:Snake"] ?? "http://localhost:5175",
                    IconPath = string.Empty,
                    Category = "Arcade"
                },
                new Game
                {
                    Title = "Minesweeper",
                    Description = "Clear the field without detonating a mine.",
                    Url = config["Seed:GameUrls:Minesweeper"] ?? "http://localhost:5176",
                    IconPath = string.Empty,
                    Category = "Puzzle"
                }
            };

            foreach (var game in games)
            {
                var existing = await db.Games.FirstOrDefaultAsync(g => g.Title == game.Title);

                if (existing is null)
                {
                    db.Games.Add(game);
                    logger.LogInformation("Seeded game {Title}", game.Title);
                }
                else if (existing.Url != game.Url)
                {
                    // Keep URLs correct when the compose port mapping changes.
                    existing.Url = game.Url;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
            }
        }
    }
}
