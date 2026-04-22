using MyApp.API.Models;
using MyApp.API.Data;

namespace MyApp.API.Services
{
  public class ParticipantService
  {
    private readonly AppDbContext _context;

    public ParticipantService(AppDbContext context)
    {
      _context = context;
    }

    public List<Participant> GetAllParticipants()
    {
      return _context.Participants.ToList();
    }

    public List<Participant> GetByTrip(int tripId)
    {
      return _context.Participants
        .Where(p => p.TripId == tripId)
        .ToList();
    }

    public Participant? GetByTripAndUser(int tripId, int userId)
    {
      return _context.Participants
        .FirstOrDefault(p => p.TripId == tripId && p.UserId == userId);
    }

    public Participant AddParticipant(Participant participant)
    {
      // Check if already participant
      var existing = GetByTripAndUser(participant.TripId, participant.UserId);
      if (existing != null)
      {
        return existing;
      }

      _context.Participants.Add(participant);
      _context.SaveChanges();
      return participant;
    }
  }
}
