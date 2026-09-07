namespace MiniSteam.Domain.Dtos
{
    /// <summary>
    /// Successful authentication result.
    /// </summary>
    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
    }
}
