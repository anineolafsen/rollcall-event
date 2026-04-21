namespace MyApp.API.Models
{
  public class UserNeedsResponse
  {
    public int TripId { get; set; }
    public string TripName { get; set; } = "";
    public string? Allergies { get; set; }
    public string? OtherInfo { get; set; }
  }
}
