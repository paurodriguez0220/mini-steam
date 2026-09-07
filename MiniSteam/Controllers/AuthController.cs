using Microsoft.AspNetCore.Mvc;
using MiniSteam.Application.Interfaces;
using MiniSteam.Domain.Dtos;

namespace MiniSteam.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        /// <summary>
        /// Exchange credentials for a JWT.
        /// </summary>
        /// <remarks>
        /// Credentials are sent in the request body. They must never be passed as route or
        /// query parameters - URLs are written to server logs, browser history and referrer
        /// headers.
        /// </remarks>
        [HttpPost("login")]
        [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var token = await _authService.AuthenticateAsync(request.Email, request.Password);

            if (token is null)
            {
                // Log the failure without echoing the submitted password.
                _logger.LogWarning("Failed authentication attempt for {Email}", request.Email);
                return Unauthorized();
            }

            return Ok(new LoginResponse { Token = token });
        }
    }
}
