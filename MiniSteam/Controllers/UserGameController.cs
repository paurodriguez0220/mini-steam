using Microsoft.AspNetCore.Mvc;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserGameController : GenericController<UserGame>
    {
        public UserGameController(IService<UserGame> service) : base(service)
        {
        }
    }
}