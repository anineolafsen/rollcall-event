using System.ComponentModel.DataAnnotations;

namespace MyApp.API.Models
{
    public class Message
    {
        [Key]
        public int Id { get; set; }
        public int EventId { get; set; }
        public int SenderParticipantId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        [MaxLength(500)]
        public string Body { get; set; } = string.Empty;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
