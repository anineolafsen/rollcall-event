namespace MyApp.API.Models
{
  public class User
  {
    public int Id { get; set; }
    public string? ClerkUserId { get; set; }
    public required string Name { get; set; }
    public string? Allergies { get; set; }
    public string? OtherInfo { get; set; }
  }
}