using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MyApp.API.Models
{
  public class Trip
  {
    [Key]
    public int Id { get; set; }

    public required string Name { get; set; }
    public required string StartDate { get; set; }
    public required string EndDate { get; set; }
    public string? Destination { get; set; }
    public string? Description { get; set; }

    [JsonIgnore]
    public ICollection<Event> Events { get; set; } = new List<Event>();

    [JsonIgnore]
    public ICollection<Participant> Participants { get; set; } = new List<Participant>();

    [JsonIgnore]
    public ICollection<Chat> Chats { get; set; } = new List<Chat>();
  }
}
