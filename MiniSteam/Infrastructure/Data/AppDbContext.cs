using Microsoft.EntityFrameworkCore;
using MiniSteam.Domain.Constants;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Game> Games { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<UserGame> UserGames { get; set; }
        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<Score> Scores { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Map entities to plural table names
            modelBuilder.Entity<User>().ToTable("Users");
            modelBuilder.Entity<Game>().ToTable("Games");
            modelBuilder.Entity<UserGame>().ToTable("UserGames");
            modelBuilder.Entity<UserProfile>().ToTable("UserProfiles");
            modelBuilder.Entity<Score>().ToTable("Scores");

            // Configure many-to-many relationship via UserGame
            modelBuilder.Entity<UserGame>()
                .HasKey(ug => ug.Id);

            modelBuilder.Entity<UserGame>()
                .HasOne(ug => ug.User)
                .WithMany(u => u.Games)
                .HasForeignKey(ug => ug.UserId);

            modelBuilder.Entity<UserGame>()
                .HasOne(ug => ug.Game)
                .WithMany(g => g.Owners)
                .HasForeignKey(ug => ug.GameId);

            // Configure one-to-one relationship User <-> UserProfile
            modelBuilder.Entity<UserProfile>()
                .HasOne(up => up.User)
                .WithOne(u => u.Profile)
                .HasForeignKey<UserProfile>(up => up.UserId);

            ConfigureScores(modelBuilder);

            base.OnModelCreating(modelBuilder);
        }

        /// <summary>
        /// Scores: an append-only log of finished runs, indexed for the two reads the
        /// leaderboard performs.
        /// </summary>
        /// <remarks>
        /// The metric kind, direction, difficulty and outcome are stored as the same short
        /// lowercase tokens the games and the storefront exchange, with explicit lengths so
        /// SQLite does not get an unbounded TEXT column.
        /// </remarks>
        private static void ConfigureScores(ModelBuilder modelBuilder)
        {
            var score = modelBuilder.Entity<Score>();

            score.Property(s => s.MetricKind)
                 .HasMaxLength(ScoreValues.MaxTokenLength)
                 .IsRequired();

            score.Property(s => s.BetterIs)
                 .HasMaxLength(ScoreValues.MaxTokenLength)
                 .IsRequired();

            score.Property(s => s.Outcome)
                 .HasMaxLength(ScoreValues.MaxTokenLength)
                 .IsRequired();

            score.Property(s => s.Difficulty)
                 .HasMaxLength(ScoreValues.MaxTokenLength);

            // Deleting a game or a user takes its scores with it - a score is meaningless
            // without both, and an orphan would break every leaderboard join.
            score.HasOne(s => s.Game)
                 .WithMany(g => g.Scores)
                 .HasForeignKey(s => s.GameId)
                 .OnDelete(DeleteBehavior.Cascade);

            score.HasOne(s => s.User)
                 .WithMany(u => u.Scores)
                 .HasForeignKey(s => s.UserId)
                 .OnDelete(DeleteBehavior.Cascade);

            // Covers the leaderboard read: filter by game (and difficulty), order by value.
            score.HasIndex(s => new { s.GameId, s.Difficulty, s.Value });

            // Covers the ranking-direction read: newest score for a game.
            score.HasIndex(s => new { s.GameId, s.AchievedAt });
        }
    }
}
