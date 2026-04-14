namespace MyApp.API.Models
{
  public class User
  {
    [Key] //This makes sure the database automatically assigns a unique id to the user when created and saved.
    public int Id { get; set; }
    public string? ClerkUserId { get; set; }
    public string? Name { get; set; }

    [Required] //email is the only thing that is required for the usermodel
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Allergies { get; set; }
    public string? OtherInfo { get; set; }
  }
}