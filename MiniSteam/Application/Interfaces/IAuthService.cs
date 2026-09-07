namespace MiniSteam.Application.Interfaces
{
    public interface IAuthService
    {
        /// <summary>
        /// Validates the supplied credentials and returns a signed JWT,
        /// or <c>null</c> when the credentials do not match a user.
        /// </summary>
        Task<string?> AuthenticateAsync(string email, string password);
    }
}
