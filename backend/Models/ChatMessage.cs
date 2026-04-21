using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApp.API.Models
{
    public class ChatMessage
    {
        [Key]
        public int MessageID { get; set; }
        
        [Required]
        [ForeignKey(nameof(Chat))]
        public int ChatID { get; set; }
        
        [Required]
        public string SenderEmail { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;
        
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}