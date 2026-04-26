using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyApp.API.Models
{
  public class Event
  {
    [Key]
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Location { get; set; }
    public required string StartDate { get; set; }
    public required string EndDate { get; set; }
    public string? Description { get; set; }
    public int? Capacity { get; set; }
    public bool HasUnlimitedCapacity { get; set; }
    public required string AttendanceMode { get; set; }
    public int TripId { get; set; }

    [JsonIgnore]
    public Trip? Trip { get; set; }

    [JsonIgnore]
    public ICollection<EventParticipant> Participants { get; set; } = new List<EventParticipant>();

    [NotMapped]
    public int ParticipantCount { get; set; }

    [NotMapped]
    public bool IsJoined { get; set; }

    [NotMapped]
    public string JoinButtonState { get; set; } = "join";
  }
}