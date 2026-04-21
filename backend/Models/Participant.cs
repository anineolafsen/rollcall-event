using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MyApp.API.Models
{
    public class Participant
    {
        public int Id {get; set; } // surrogate Primary Key 

        [Required]
        public int TripID { get; set; }
        
        [JsonIgnore]
        public Trip? Trip { get; set; }

        [Required]
        public int UserID { get; set; }
        
        [JsonIgnore]
        public User? User { get; set; }

        public bool IsOrganizer { get; set; } = false;

        public string? Allergies { get; set; }
        public string? OtherInfo { get; set; }
    }
}