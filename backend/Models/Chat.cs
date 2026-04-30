using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApp.API.Models
{
    public class Chat
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [ForeignKey(nameof(Trip))]
        public int TripId { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;

        [ForeignKey(nameof(Creator))]
        public int CreatorId { get; set; }
        public User? Creator { get; set; }
                
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}