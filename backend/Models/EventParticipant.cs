using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApp.API.Models
{
    public class EventParticipant
    {
        [Key]
        public int EventParticipantID { get; set; }

        public int EventID { get; set; }

        public string UserID { get; set; } = string.Empty;

        [ForeignKey(nameof(EventID))]
        public Event? Event { get; set; }
    }
}