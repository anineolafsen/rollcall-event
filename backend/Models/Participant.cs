using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MyApp.API.Models
{
    public class Participant
    {
        [Key]
        public int Id {get; set; } // surrogate Primary Key 

        // unique index (TripId, UserId) - configured in AppDbContext
        [Required]
        public int TripId { get; set; }
        
        [JsonIgnore]
        public Trip? Trip { get; set; }

        [Required]
        public int UserId { get; set; }
        
        [JsonIgnore]
        public User? User { get; set; }

        public bool IsOrganizer { get; set; } = false;

        public string? Allergies { get; set; }
        public string? OtherInfo { get; set; }
    }
}