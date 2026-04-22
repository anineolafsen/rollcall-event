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
      // Check for duplicates
      var existing = _context.Invitations
        .FirstOrDefault(i => i.TripId == invitation.TripId && i.Email == invitation.Email);
      
      if (existing != null)
      {
        return existing; // Return existing if duplicate
      }

      _context.Invitations.Add(invitation);
      _context.SaveChanges();
      return invitation;
    }

    public List<Invitation> GetByEmail(string email)
    {
      return _context.Invitations
        .Where(i => i.Email == email)
        .ToList();
    }

    public List<Invitation> GetByTripId(int tripId)
    {
      return _context.Invitations
        .Where(i => i.TripId == tripId)
        .ToList();
    }

    public bool AcceptInvitation(int invitationId, int userId)
    {
      // Use a transaction to ensure safe movement of data from Invitations to Participants
      using var transaction = _context.Database.BeginTransaction();
      try
      {
        var invitation = _context.Invitations.Find(invitationId);
        if (invitation == null) return false;

        // Transform invitation into Participant record
        var participant = new Participant
        {
          TripId = invitation.TripId,
          UserId = userId
        };
        _context.Participants.Add(participant);

        // Delete invitation after Participant relation is established
        _context.Invitations.Remove(invitation);

        _context.SaveChanges();
        transaction.Commit();
        return true;
      }
      catch
      {
        transaction.Rollback();
        throw; // Re-throw exception after rollback
      }
    }

    public bool RemoveInvitation(int tripId, string email)
    {
      var invitation = _context.Invitations
        .FirstOrDefault(i => i.TripId == tripId && i.Email == email);
      
      if (invitation == null)
      {
        return false;
      }

      _context.Invitations.Remove(invitation);
      _context.SaveChanges();
      return true;
    }
  }
}
