using System;
using System.ComponentModel.DataAnnotations;

namespace MyApp.API.Models
{
    public class Checkin
    {
        [Key]
        public int CheckinID { get; set; }
        public int EventID { get; set; }
        public int ParticipantID { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}