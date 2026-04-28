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

        public string CreatorId { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}