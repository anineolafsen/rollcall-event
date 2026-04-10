namespace MyApp.API.Models
{
    // Klasse for å ikke eksponere hele User-modellen
  public class UpdateUserNeeds
  {
    public string? Allergies { get; set; }
    public string? OtherInfo { get; set; }
  }
}