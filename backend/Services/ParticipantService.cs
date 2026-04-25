using MyApp.API.Models;
using MyApp.API.Data;
using Microsoft.EntityFrameworkCore;

namespace MyApp.API.Services
{
  public class TripNeedsDto
  {
    public int TripId { get; set; }
    public string TripName { get; set; } = string.Empty;
    public string? Allergies { get; set; }
    public string? OtherInfo { get; set; }
  }

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

    public List<TripNeedsDto> GetTripNeedsByUser(int userId)
    {
      return _context.Participants
        .Where(p => p.UserId == userId)
        .Select(p => new TripNeedsDto
        {
          TripId = p.TripId,
          TripName = p.Trip!.Name,
          Allergies = p.Allergies,
          OtherInfo = p.OtherInfo,
        })
        .ToList();
    }

    public bool UpdateNeeds(int tripId, int userId, string? allergies, string? otherInfo)
    {
      var participant = _context.Participants
        .FirstOrDefault(p => p.TripId == tripId && p.UserId == userId);
      if (participant == null) return false;
      participant.Allergies = allergies;
      participant.OtherInfo = otherInfo;
      _context.SaveChanges();
      return true;
    }

    public Participant AddParticipant(Participant participant)
    {
      // Check if already participant
      var existing = GetByTripAndUser(participant.TripId, participant.UserId);
      if (existing != null) return existing;

      _context.Participants.Add(participant);
      _context.SaveChanges();
      return participant;
    }
  }
}
