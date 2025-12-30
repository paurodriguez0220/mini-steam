using Azure.Core;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using MiniSteam.Application.Interfaces;
using MiniSteam.Infrastructure.Repositories;

namespace MiniSteam.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpGet("{email}/{password}")]
        public virtual async Task<IActionResult> Get(string email, string password)
        {
            var token = await _authService.AuthenticateAsync(email, password);
            if (token == null) return Unauthorized();

            return Ok(new { Token = token });
        }
    }
}
