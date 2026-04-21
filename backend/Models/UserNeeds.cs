using System.ComponentModel.DataAnnotations.Schema;

namespace MyApp.API.Models
{
  // One row per (user, trip). Deleted automatically when the trip is deleted (cascade).
  public class UserNeeds
  {
    // Composite primary key configured in AppDbContext: (UserId, TripId)
    public int UserId { get; set; }

    public int TripId { get; set; }

    public string? Allergies { get; set; }

    public string? OtherInfo { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }

    [ForeignKey("TripId")]
    public Trip? Trip { get; set; }
  }
}
