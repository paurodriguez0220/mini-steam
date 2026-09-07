using System.ComponentModel.DataAnnotations;

namespace MiniSteam.Domain.Dtos
{
    /// <summary>
    /// Credentials supplied to <c>POST /api/auth/login</c>.
    /// </summary>
    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        [MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(128)]
        public string Password { get; set; } = string.Empty;
    }
}
