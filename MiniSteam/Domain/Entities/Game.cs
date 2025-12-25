using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MiniSteam.Domain.Entities
{
    public class Game : BaseEntity
    {
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string Url { get; set; }
        public required string IconPath { get; set; }
        public required string Category { get; set; }
    }
}
