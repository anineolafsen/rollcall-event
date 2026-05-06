using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApp.API.Models
{
    public class ChatMessage
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [ForeignKey(nameof(Chat))]
        public int ChatId { get; set; }
        public Chat? Chat { get; set; }
        
        [Required]
        [ForeignKey(nameof(Sender))]
        public int SenderId { get; set; }
        public User? Sender { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;
        
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}