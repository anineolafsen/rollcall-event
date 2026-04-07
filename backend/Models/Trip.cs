using System.ComponentModel.DataAnnotations;

namespace MyApp.API.Models
{
  public class Trip
  {
    [Key]
    public int TripID { get; set; }
    public required string Name { get; set; }
    public required string StartDate { get; set; }
    public required string EndDate { get; set; }
    public string? Destination { get; set; }
    public string? Description { get; set; }
  }
}