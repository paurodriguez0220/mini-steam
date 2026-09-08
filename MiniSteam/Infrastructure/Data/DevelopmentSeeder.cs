using Microsoft.EntityFrameworkCore;
using MiniSteam.Domain.Constants;
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

            // Scores reference the user and the games by id, so those rows have to exist
            // before the score seed can point at them.
            await db.SaveChangesAsync();

            await SeedScoresAsync(db, logger);

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

        /// <summary>
        /// Inserts a handful of finished runs so the storefront has a board to render before
        /// anyone has played anything.
        /// </summary>
        /// <remarks>
        /// Only runs when the table is empty, so a local database that already has real
        /// scores is never touched. The Minesweeper rows deliberately include a loss - it is
        /// the fastest row in the table and must not appear on an ascending board.
        /// </remarks>
        private static async Task SeedScoresAsync(AppDbContext db, ILogger logger)
        {
            if (await db.Scores.AnyAsync())
            {
                return;
            }

            var user = await db.Users.OrderBy(u => u.Id).FirstOrDefaultAsync();
            if (user is null)
            {
                logger.LogInformation("No seeded user - skipping score seed.");
                return;
            }

            var gameIdsByTitle = await db.Games.ToDictionaryAsync(g => g.Title, g => g.Id);
            var now = DateTime.UtcNow;

            var seeds = new ScoreSeed[]
            {
                new("2048", ScoreValues.MetricKinds.Points, 3_284, ScoreValues.Outcomes.Lost, null, now.AddDays(-6)),
                new("2048", ScoreValues.MetricKinds.Points, 11_520, ScoreValues.Outcomes.Lost, null, now.AddDays(-4)),
                new("Snake", ScoreValues.MetricKinds.Points, 14, ScoreValues.Outcomes.Lost, null, now.AddDays(-5)),
                new("Snake", ScoreValues.MetricKinds.Points, 31, ScoreValues.Outcomes.Lost, null, now.AddDays(-2)),
                new("Minesweeper", ScoreValues.MetricKinds.Seconds, 38, ScoreValues.Outcomes.Won, ScoreValues.Difficulties.Easy, now.AddDays(-5)),
                new("Minesweeper", ScoreValues.MetricKinds.Seconds, 122, ScoreValues.Outcomes.Won, ScoreValues.Difficulties.Medium, now.AddDays(-3)),
                new("Minesweeper", ScoreValues.MetricKinds.Seconds, 264, ScoreValues.Outcomes.Won, ScoreValues.Difficulties.Hard, now.AddDays(-1)),
                new("Minesweeper", ScoreValues.MetricKinds.Seconds, 3, ScoreValues.Outcomes.Lost, ScoreValues.Difficulties.Hard, now.AddHours(-6))
            };

            var seeded = 0;

            foreach (var seed in seeds)
            {
                if (!gameIdsByTitle.TryGetValue(seed.GameTitle, out var gameId))
                {
                    continue;
                }

                db.Scores.Add(new Score
                {
                    GameId = gameId,
                    UserId = user.Id,
                    MetricKind = seed.MetricKind,
                    Value = seed.Value,
                    BetterIs = ScoreValues.RequiredDirectionFor(seed.MetricKind)!,
                    Difficulty = seed.Difficulty,
                    Outcome = seed.Outcome,
                    AchievedAt = seed.AchievedAt
                });

                seeded++;
            }

            logger.LogInformation("Seeded {Count} development scores", seeded);
        }

        /// <summary>A score to seed, keyed by game title because ids are assigned at runtime.</summary>
        private sealed record ScoreSeed(
            string GameTitle,
            string MetricKind,
            int Value,
            string Outcome,
            string? Difficulty,
            DateTime AchievedAt);
    }
}
