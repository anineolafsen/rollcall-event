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
    public string? Name { get; set; }

    [Required]
    public string? Email { get; set; }
    public string? Phone { get; set; }
  }
}