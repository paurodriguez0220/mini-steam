using Microsoft.EntityFrameworkCore;
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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Map entities to plural table names
            modelBuilder.Entity<User>().ToTable("Users");
            modelBuilder.Entity<Game>().ToTable("Games");
            modelBuilder.Entity<UserGame>().ToTable("UserGames");
            modelBuilder.Entity<UserProfile>().ToTable("UserProfiles");

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

            base.OnModelCreating(modelBuilder);
        }
    }
}
