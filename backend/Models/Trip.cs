using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MyApp.API.Models
{
  public class Trip
  {
    [Key]
    public int TripID { get; set; }
    // public string OwnerID { get; set; } = string.Empty;
    public required string Name { get; set; }
    public required string StartDate { get; set; }
    public required string EndDate { get; set; }
    public string? Destination { get; set; }
    public string? Description { get; set; }
    [JsonIgnore]
    public ICollection<Event> Events { get; set; } = new List<Event>();
  }
}
