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
    public int Id { get; set; }
    public required string Name { get; set; }
    // Clerk user ID (string, globally unique)
    public required string ClerkUserId { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
  }
}