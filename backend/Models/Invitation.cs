using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApp.API.Models
{
    public class Invitation
    {
        [Required]
        public int TripID { get; set; }
        
        [StringLength(255)]
        [Required]
        public string UserEmail { get; set; } = string.Empty;
    }
}