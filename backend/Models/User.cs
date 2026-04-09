using System.Collections.Specialized;
using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace MyApp.API.Models
{
  public class User
  {
    public required int Id { get; set; }
    public required string Name { get; set; }
  }
}