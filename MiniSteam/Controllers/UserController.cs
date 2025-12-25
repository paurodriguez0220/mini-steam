using Microsoft.AspNetCore.Mvc;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Entities;

namespace MiniSteam.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : GenericController<User>
    {
        public UserController(IService<User> service) : base(service)
        {
        }
    }
}
