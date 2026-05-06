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

  public class TripParticipantDto
  {
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsOrganizer { get; set; }
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

    public List<TripParticipantDto> GetTripParticipants(int tripId)
    {
      return _context.Participants
        .Include(p => p.User)
        .Where(p => p.TripId == tripId)
        .Select(p => new TripParticipantDto
        {
          UserId = p.UserId,
          Name = (p.User!.FirstName + " " + p.User.LastName).Trim(),
          Email = p.User!.Email,
          IsOrganizer = p.IsOrganizer
        })
        .OrderByDescending(p => p.IsOrganizer)
        .ThenBy(p => p.Name == string.Empty ? p.Email : p.Name)
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

    public TripParticipantDto? PromoteToOrganizer(int tripId, int userId)
    {
      var participant = _context.Participants
        .Include(p => p.User)
        .FirstOrDefault(p => p.TripId == tripId && p.UserId == userId);

      if (participant == null || participant.User == null)
      {
        return null;
      }

      if (!participant.IsOrganizer)
      {
        participant.IsOrganizer = true;
        _context.SaveChanges();
      }

      return new TripParticipantDto
      {
        UserId = participant.UserId,
        Name = (participant.User.FirstName + " " + participant.User.LastName).Trim(),
        Email = participant.User.Email,
        IsOrganizer = participant.IsOrganizer
      };
    }
  }
}
