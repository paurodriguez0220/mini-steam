using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Entities;
using MiniSteam.Domain.Dtos;

namespace MiniSteam.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GamesController : GenericController<Game, GameDto>
    {
        public GamesController(IService<Game, GameDto> service) : base(service)
        {
        }
    }
}