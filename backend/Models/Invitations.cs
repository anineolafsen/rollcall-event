using System.Collections.Specialized;
using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace MyApp.API.Models
{
  public class Invitations
  {
    public required int TripID { get; set; }
    public required string UserMail { get; set; }
  }
}