using System.ComponentModel.DataAnnotations;

namespace MyApp.API.Models
{
  public enum CheckinSessionType
  {
    Self = 0,
    Qr = 1,
  }

  public class EventCheckinSession
  {
    [Key]
    public int SessionID { get; set; }

    public int EventID { get; set; }

    public CheckinSessionType SessionType { get; set; } = CheckinSessionType.Self;

    public string? Token { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? EndedAt { get; set; }

    public bool IsActive { get; set; } = true;
  }
}
