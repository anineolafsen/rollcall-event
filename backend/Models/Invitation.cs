using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApp.API.Models
{
    public class Invitation
    {
        [Key]
        public int Id {get; set;} // surrogate Primary Key

        // Unique index (TripId, Email)
        [Required]
        public int TripId { get; set; }
        
        [StringLength(255)]
        [Required]
        public string Email { get; set; } = string.Empty;
    }
}