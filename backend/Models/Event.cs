using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MyApp.API.Models
{
  public class Event
  {
    [Key]
    public int EventID { get; set; }
    public required string Name { get; set; }
    public required string Location { get; set; }
    public required string StartDate { get; set; }
    public required string EndDate { get; set; }
    public string? Description { get; set; }
    public int? Capacity { get; set; }
    public bool HasUnlimitedCapacity { get; set; }
    public required string AttendanceMode { get; set; }
    public int TripID { get; set; }
    [JsonIgnore]
    public Trip? Trip { get; set; }
  }
}
