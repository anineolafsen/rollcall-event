using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyApp.API.Models
{
    [PrimaryKey(nameof(ChatId), nameof(UserId))]
    public class ChatParticipant
    {
        [ForeignKey(nameof(Chat))]
        public int ChatId { get; set; }
        public Chat? Chat { get; set; }
        
        [ForeignKey(nameof(User))]
        public int UserId { get; set; }
        public User? User { get; set; }
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}