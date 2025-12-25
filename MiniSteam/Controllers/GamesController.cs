using Microsoft.AspNetCore.Mvc;
using MiniSteam.Application.Services;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class GamesController : ControllerBase
    {
        private readonly GameService _service;
        public GamesController(GameService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _service.GetAllGamesAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var game = await _service.GetGameByIdAsync(id);
            return game == null ? NotFound() : Ok(game);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Game game)
        {
            await _service.AddGameAsync(game);
            return CreatedAtAction(nameof(GetById), new { id = game.Id }, game);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Game game)
        {
            if (id != game.Id) return BadRequest();
            await _service.UpdateGameAsync(game);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteGameAsync(id);
            return NoContent();
        }
    }
}
