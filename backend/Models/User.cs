using System.ComponentModel.DataAnnotations;

namespace MyApp.API.Models
{
  public class User
  {
    [Key]
    public int Id { get; set; }
    public string? Name { get; set; }

    [Required]
    public string? Email { get; set; }
    public string? Phone { get; set; }
  }
}