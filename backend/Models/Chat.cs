using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApp.API.Models
{
    public class Chat
    {
        [Key]
        public int ChatID { get; set; }
        
        [Required]
        [ForeignKey(nameof(Trip))]
        public int TripID { get; set; }
        
        [Required]
        public string CreatorID { get; set; } = string.Empty;
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}