using System.Collections.Specialized;
using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace MyApp.API.Models
{public class Trip
  {
    public required int TripID { get; set; }
    public required string Name { get; set; }
    public required string StartDate { get; set; }
    public required string EndDate { get; set; }
    public string? Destination { get; set; }
    public string? Description { get; set; }
  }
}