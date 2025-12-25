namespace MiniSteam.Domain.Entities
{
    public class UserProfile : BaseEntity
    {
        public int UserId { get; set; }
        public required string DisplayName { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        public string? Country { get; set; }
        public required User User { get; set; }
    }
}
