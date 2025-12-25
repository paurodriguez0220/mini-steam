namespace MiniSteam.Domain.Entities
{
    public class UserGame : BaseEntity
    {
        public int UserId { get; set; }
        public int GameId { get; set; }
        public User User { get; set; } = null!;
        public Game Game { get; set; } = null!;
    }
}
