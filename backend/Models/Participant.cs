using System.ComponentModel.DataAnnotations;

namespace MyApp.API.Models
{
    public class Participant
    {
        [Key]
        public int Id { get; set; }
        
        public int TripID { get; set; }
        
        public string UserID { get; set; } = string.Empty;
    }
}