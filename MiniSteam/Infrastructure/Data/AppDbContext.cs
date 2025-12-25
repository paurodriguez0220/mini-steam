using Microsoft.EntityFrameworkCore;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Game> Games { get; set; }
    }
}
