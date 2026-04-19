using System.ComponentModel.DataAnnotations;

namespace MyApp.API.Models
{
    public class Participant
    {
        public int Id {get; set; } // surrogate Primary Key 

        // unique index (TripID, UserID)
        [Required]
        public int TripID { get; set; }
        [Required]
        public int UserID { get; set; }

        public string? Allergies { get; set; }
        public string? OtherInfo { get; set; }
        public int? InvitationID { get; set; }
    }
}