using Microsoft.EntityFrameworkCore;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Entities;
using MiniSteam.Infrastructure.Data;

namespace MiniSteam.Infrastructure.Repositories
{
    public class GameRepository : IGameRepository
    {
        private readonly AppDbContext _context;

        public GameRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Game>> GetAllAsync() => await _context.Games.ToListAsync();
        public async Task<Game> GetByIdAsync(int id) => await _context.Games.FindAsync(id);
        public async Task AddAsync(Game game) { _context.Games.Add(game); await _context.SaveChangesAsync(); }
        public async Task UpdateAsync(Game game) { _context.Entry(game).State = EntityState.Modified; await _context.SaveChangesAsync(); }
        public async Task DeleteAsync(int id) { var game = await _context.Games.FindAsync(id); _context.Games.Remove(game); await _context.SaveChangesAsync(); }
    }
}
