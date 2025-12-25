namespace MiniSteam.Domain.Entities
{
    public class User : BaseEntity
    {
        public required string UserName { get; set; }
        public required string Email { get; set; }
        public required string PasswordHash { get; set; }
        public bool EmailConfirmed { get; set; }
        DateTime? LastLoginAt { get; set; }

        // Navigation
        public UserProfile Profile { get; set; } = null!;
        public ICollection<UserGame> Games { get; set; } = new List<UserGame>();
    }
}
