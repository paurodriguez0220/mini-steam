using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Entities;
using MiniSteam.Infrastructure.Repositories;

namespace MiniSteam.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GamesController : GenericController<Game>
    {
        public GamesController(IService<Game> service) : base(service)
        {
        }
    }
}
