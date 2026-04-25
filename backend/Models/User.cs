using System.Collections.Specialized;
using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace MyApp.API.Models
{
  public class User
  {
    [Key]
    public int Id { get; set; } // internal primary key
    [Required]
    public string ClerkId { get; set; } = string.Empty; // external auth ID
    [Required]
    public string Email { get; set; } = string.Empty;

    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
  }
}