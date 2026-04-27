using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApp.API.Models
{
    public class ChatParticipant
    {
        [Key]
        [Column(Order = 0)]
        [ForeignKey(nameof(Chat))]
        public int ChatId { get; set; }
        
        [Key]
        [Column(Order = 1)]
        public string UserEmail { get; set; } = string.Empty;
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}