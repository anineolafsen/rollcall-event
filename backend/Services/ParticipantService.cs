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

  public class ParticipantNeedsDto
  {
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Allergies { get; set; }
    public string? OtherInfo { get; set; }
  }

  public class ParticipantContactDto
  {
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
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

    public List<ParticipantNeedsDto> GetNeedsByTrip(int tripId)
    {
      return _context.Participants
        .Include(p => p.User)
        .Where(p => p.TripId == tripId)
        .Select(p => new ParticipantNeedsDto
        {
          UserId = p.UserId,
          Name = (p.User!.FirstName + " " + p.User.LastName).Trim(),
          Email = p.User!.Email,
          Allergies = p.Allergies,
          OtherInfo = p.OtherInfo
        })
        .ToList();
    }

    public List<ParticipantContactDto> GetContactsByTrip(int tripId)
    {
      return _context.Participants
        .Include(p => p.User)
        .Where(p => p.TripId == tripId && p.User!.Phone != null)
        .Select(p => new ParticipantContactDto
        {
          UserId = p.UserId,
          Name = (p.User!.FirstName + " " + p.User.LastName).Trim(),
          Phone = p.User!.Phone!
        })
        .ToList();
    }

    public string? GetOrganizerPhoneByTrip(int tripId)
    {
      return _context.Participants
        .Include(p => p.User)
        .Where(p => p.TripId == tripId && p.IsOrganizer && p.User != null && p.User.Phone != null && p.User.Phone != "")
        .Select(p => p.User!.Phone)
        .FirstOrDefault();
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
