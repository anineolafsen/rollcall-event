using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApp.API.Models
{
    public class Invitation
    {
        public int Id {get; set;} // surrogate Primary Key

        // Unique index (TripID, Email)
        [Required]
        public int TripID { get; set; }
        
        [StringLength(255)]
        [Required]
        public string Email { get; set; } = string.Empty;
    }
}