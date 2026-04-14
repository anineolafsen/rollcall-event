using MyApp.API.Models;
using MyApp.API.Data;

namespace MyApp.API.Services
{
  public class InvitationService
  {
    private readonly AppDbContext _context;

    public InvitationService(AppDbContext context)
    {
      _context = context;
    }

    public Invitation AddInvitation(Invitation invitation)
    {
      _context.Invitations.Add(invitation);
      _context.SaveChanges();
      return invitation;
    }
  }
}
