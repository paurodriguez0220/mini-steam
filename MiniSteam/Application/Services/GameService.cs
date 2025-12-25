using Microsoft.AspNetCore.Mvc;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Application.Services
{
    public class GameService
    {
        private readonly IGameRepository _repo;
        public GameService(IGameRepository repo) => _repo = repo;

        public Task<IEnumerable<Game>> GetAllGamesAsync() => _repo.GetAllAsync();
        public Task<Game> GetGameByIdAsync(int id) => _repo.GetByIdAsync(id);
        public Task AddGameAsync(Game game) => _repo.AddAsync(game);
        public Task UpdateGameAsync(Game game) => _repo.UpdateAsync(game);
        public Task DeleteGameAsync(int id) => _repo.DeleteAsync(id);
    }
}
