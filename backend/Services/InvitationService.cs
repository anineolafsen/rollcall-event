using MyApp.API.Models;
using MyApp.API.Data;
using System.Runtime.CompilerServices;

namespace MyApp.API.Services
{
  public class InvitationService
  {
    private readonly AppDbContext _context;

    public InvitationService(AppDbContext context)
    {
      _context = context;
    }

    public List<Invitation> GetAllInvitations()
    {
      return _context.Invitations.ToList();
    }

    public Invitation AddInvitation(Invitation invitation)
    {
      _context.Invitations.Add(invitation);
      _context.SaveChanges();
      return invitation;
    }
  }
}