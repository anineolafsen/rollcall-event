using MyApp.API.Data;
using MyApp.API.Models;

namespace MyApp.API.Services
{
  public class EventParticipantCheckinStatusDto
  {
    public int ParticipantID { get; set; }
    public string UserID { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool IsCheckedIn { get; set; }
    public DateTime? CheckedInAt { get; set; }
  }

  public class CheckinService
  {
    private readonly AppDbContext _context;

    public CheckinService(AppDbContext context)
    {
      _context = context;
    }

    public EventCheckinSession? GetActiveSession(int eventId, CheckinSessionType sessionType)
    {
      return _context.EventCheckinSessions
          .FirstOrDefault(s => s.EventID == eventId && s.IsActive && s.SessionType == sessionType);
    }

    public (EventCheckinSession? Session, string Error) StartSession(
        int eventId,
        CheckinSessionType sessionType,
        int qrTokenLifetimeMinutes = 15)
    {
      var appEvent = _context.Events.FirstOrDefault(e => e.Id == eventId);
      if (appEvent == null)
      {
        return (null, "Event not found.");
      }

      var activeSessions = _context.EventCheckinSessions
          .Where(s => s.EventID == eventId && s.IsActive && s.SessionType == sessionType)
          .ToList();

      foreach (var session in activeSessions)
      {
        session.IsActive = false;
        session.EndedAt = DateTime.UtcNow;
      }

      // New session should always start from a clean check-in state for this event.
      var existingCheckins = _context.Checkins
          .Where(c => c.EventID == eventId)
          .ToList();

      if (existingCheckins.Count > 0)
      {
        _context.Checkins.RemoveRange(existingCheckins);
      }

      var newSession = new EventCheckinSession
      {
        EventID = eventId,
        SessionType = sessionType,
        StartedAt = DateTime.UtcNow,
        IsActive = true,
      };

      if (sessionType == CheckinSessionType.Qr)
      {
        newSession.Token = GenerateToken();
        newSession.ExpiresAt = DateTime.UtcNow.AddMinutes(qrTokenLifetimeMinutes);
      }

      _context.EventCheckinSessions.Add(newSession);
      _context.SaveChanges();

      return (newSession, string.Empty);
    }

    public bool StopSession(int eventId, CheckinSessionType sessionType)
    {
      var session = _context.EventCheckinSessions
          .FirstOrDefault(s => s.EventID == eventId && s.IsActive && s.SessionType == sessionType);

      if (session == null)
      {
        return false;
      }

      session.IsActive = false;
      session.EndedAt = DateTime.UtcNow;
      _context.SaveChanges();
      return true;
    }

    public List<string> GetParticipantUserIdsToNotify(int eventId)
    {
      var appEvent = _context.Events.FirstOrDefault(e => e.Id == eventId);
      if (appEvent == null)
      {
        return new List<string>();
      }

      var joinedUserIds = _context.EventParticipants
          .Where(ep => ep.EventID == eventId)
          .Select(ep => ep.UserID)
          .Distinct()
          .ToList();

      var participantUsers = (from p in _context.Participants
                              join u in _context.Users on p.UserId equals u.Id
                              where p.TripId == appEvent.TripId && !p.IsOrganizer
                              select new { Participant = p, ClerkId = u.ClerkId }).ToList();

      return participantUsers
          .Where(x => IsMandatoryAttendance(appEvent) || joinedUserIds.Contains(x.ClerkId))
          .Select(x => x.ClerkId)
          .Distinct()
          .ToList();
    }

    public List<EventParticipantCheckinStatusDto> GetEventParticipantStatuses(int eventId)
    {
      var appEvent = _context.Events.FirstOrDefault(e => e.Id == eventId);
      if (appEvent == null)
      {
        return new List<EventParticipantCheckinStatusDto>();
      }

      var checkins = _context.Checkins
          .Where(c => c.EventID == eventId)
          .ToList();

      var latestCheckinByParticipant = checkins
          .GroupBy(c => c.ParticipantID)
          .ToDictionary(g => g.Key, g => g.OrderByDescending(c => c.Timestamp).First());

      var participants = (from p in _context.Participants
                          join u in _context.Users on p.UserId equals u.Id
                          where p.TripId == appEvent.TripId && !p.IsOrganizer
                          select new { Participant = p, User = u })
          .ToList();

      var joinedUserIds = _context.EventParticipants
        .Where(ep => ep.EventID == eventId)
        .Select(ep => ep.UserID)
        .Distinct()
        .ToList();

      var eligibleParticipants = participants
        .Where(x => IsMandatoryAttendance(appEvent) || joinedUserIds.Contains(x.User.ClerkId))
        .ToList();

      return eligibleParticipants
        .Select(x =>
        {
          var p = x.Participant;
          var u = x.User;
          return new EventParticipantCheckinStatusDto
          {
            ParticipantID = p.Id,
            UserID = u.ClerkId,
            Name = string.IsNullOrWhiteSpace($"{u.FirstName} {u.LastName}".Trim())
              ? u.Email
              : $"{u.FirstName} {u.LastName}".Trim(),
            Email = u.Email,
            Phone = u.Phone,
            IsCheckedIn = latestCheckinByParticipant.ContainsKey(p.Id),
            CheckedInAt = latestCheckinByParticipant.TryGetValue(p.Id, out var latest)
              ? latest.Timestamp
              : null,
          };
        })
        .OrderBy(x => x.Name)
        .ToList();
    }

    public List<int> GetActiveCheckinEventIdsForUser(string userId)
    {
      var user = _context.Users.FirstOrDefault(u => u.ClerkId == userId);
      if (user == null)
      {
        return new List<int>();
      }

      var participantMemberships = _context.Participants
        .Where(p => p.UserId == user.Id)
        .ToList();

      var tripIds = participantMemberships
        .Where(p => !p.IsOrganizer)
        .Select(p => p.TripId)
        .Distinct()
        .ToList();

      if (tripIds.Count == 0)
      {
        return new List<int>();
      }

      var joinedEventIds = _context.EventParticipants
        .Where(ep => ep.UserID == userId)
        .Select(ep => ep.EventID)
        .Distinct()
        .ToList();

      var activeSessions = (from s in _context.EventCheckinSessions
                            join e in _context.Events on s.EventID equals e.Id
                            where s.IsActive && s.SessionType == CheckinSessionType.Self && tripIds.Contains(e.TripId)
                            select new { s.EventID, Event = e })
        .ToList();

      return activeSessions
        .Where(x => IsMandatoryAttendance(x.Event) || joinedEventIds.Contains(x.EventID))
        .Select(x => x.EventID)
        .Distinct()
        .ToList();
    }

    public void CheckInParticipant(int eventId, int participantId)
    {
      var appEvent = _context.Events.FirstOrDefault(e => e.Id == eventId);
      if (appEvent == null)
      {
        return;
      }

      var hasActiveSession = _context.EventCheckinSessions
          .Any(s => s.EventID == eventId && s.IsActive && s.SessionType == CheckinSessionType.Self);

      if (!hasActiveSession)
      {
        return;
      }

      var participant = _context.Participants
          .FirstOrDefault(p => p.Id == participantId && p.TripId == appEvent.TripId);

      if (participant == null || participant.IsOrganizer)
      {
        return;
      }

      if (!IsParticipantEligibleForEvent(appEvent, participant))
      {
        return;
      }

      var alreadyCheckedIn = _context.Checkins
          .Any(c => c.EventID == eventId && c.ParticipantID == participantId);

      if (alreadyCheckedIn)
      {
        return;
      }

      _context.Checkins.Add(new Checkin
      {
        EventID = eventId,
        ParticipantID = participantId,
        Timestamp = DateTime.UtcNow,
      });

      _context.SaveChanges();
      AutoStopSessionIfCompleted(appEvent, CheckinSessionType.Self);
    }

    public void ValidateQrAndCheckin(string token, int participantId)
    {
      var session = _context.EventCheckinSessions
          .FirstOrDefault(s =>
              s.Token == token &&
              s.IsActive &&
              s.SessionType == CheckinSessionType.Qr);

      if (session == null)
      {
        return;
      }

      if (session.ExpiresAt.HasValue && session.ExpiresAt.Value < DateTime.UtcNow)
      {
        return;
      }

      var appEvent = _context.Events.FirstOrDefault(e => e.Id == session.EventID);
      if (appEvent == null)
      {
        return;
      }

      var participant = _context.Participants
          .FirstOrDefault(p => p.Id == participantId && p.TripId == appEvent.TripId);

      if (participant == null || participant.IsOrganizer)
      {
        return;
      }

      if (!IsParticipantEligibleForEvent(appEvent, participant))
      {
        return;
      }

      var alreadyCheckedIn = _context.Checkins
          .Any(c => c.EventID == session.EventID && c.ParticipantID == participantId);

      if (alreadyCheckedIn)
      {
        return;
      }

      _context.Checkins.Add(new Checkin
      {
        EventID = session.EventID,
        ParticipantID = participantId,
        Timestamp = DateTime.UtcNow,
      });

      _context.SaveChanges();
      AutoStopSessionIfCompleted(appEvent, CheckinSessionType.Qr);
    }

    public void UncheckInParticipant(int eventId, int participantId)
    {
      var appEvent = _context.Events.FirstOrDefault(e => e.Id == eventId);
      if (appEvent == null)
      {
        return;
      }

      var hasActiveSession = _context.EventCheckinSessions
          .Any(s => s.EventID == eventId && s.IsActive && s.SessionType == CheckinSessionType.Self);

      if (!hasActiveSession)
      {
        return;
      }

      var participant = _context.Participants
          .FirstOrDefault(p => p.Id == participantId && p.TripId == appEvent.TripId);

      if (participant == null || participant.IsOrganizer)
      {
        return;
      }

      if (!IsParticipantEligibleForEvent(appEvent, participant))
      {
        return;
      }

      var checkin = _context.Checkins
          .Where(c => c.EventID == eventId && c.ParticipantID == participantId)
          .OrderByDescending(c => c.Timestamp)
          .FirstOrDefault();

      if (checkin == null)
      {
        return;
      }

      _context.Checkins.Remove(checkin);
      _context.SaveChanges();
    }

    private static string GenerateToken()
    {
      return Convert.ToBase64String(Guid.NewGuid().ToByteArray())
          .Replace("=", "").Replace("+", "").Replace("/", "");
    }

    private static bool IsMandatoryAttendance(Event appEvent)
    {
      return string.Equals(appEvent.AttendanceMode, "mandatory", StringComparison.OrdinalIgnoreCase);
    }

    private bool IsParticipantEligibleForEvent(Event appEvent, Participant participant)
    {
      if (participant.TripId != appEvent.TripId || participant.IsOrganizer)
      {
        return false;
      }

      if (IsMandatoryAttendance(appEvent))
      {
        return true;
      }

      var user = _context.Users.FirstOrDefault(u => u.Id == participant.UserId);
      if (user == null)
      {
        return false;
      }

      return _context.EventParticipants
          .Any(ep => ep.EventID == appEvent.Id && ep.UserID == user.ClerkId);
    }

    private void AutoStopSessionIfCompleted(Event appEvent, CheckinSessionType sessionType)
    {
      var eligibleParticipantIds = GetEligibleParticipantIds(appEvent);
      if (eligibleParticipantIds.Count == 0)
      {
        return;
      }

      var checkedInParticipantIds = _context.Checkins
          .Where(c => c.EventID == appEvent.Id && eligibleParticipantIds.Contains(c.ParticipantID))
          .Select(c => c.ParticipantID)
          .Distinct()
          .ToList();

      if (checkedInParticipantIds.Count != eligibleParticipantIds.Count)
      {
        return;
      }

      var activeSession = _context.EventCheckinSessions
          .FirstOrDefault(s => s.EventID == appEvent.Id && s.IsActive && s.SessionType == sessionType);

      if (activeSession == null)
      {
        return;
      }

      activeSession.IsActive = false;
      activeSession.EndedAt = DateTime.UtcNow;
      _context.SaveChanges();
    }

    private List<int> GetEligibleParticipantIds(Event appEvent)
    {
      var participants = _context.Participants
          .Where(p => p.TripId == appEvent.TripId && !p.IsOrganizer)
          .ToList();

      if (IsMandatoryAttendance(appEvent))
      {
        return participants.Select(p => p.Id).ToList();
      }

      var joinedUserIds = _context.EventParticipants
          .Where(ep => ep.EventID == appEvent.Id)
          .Select(ep => ep.UserID)
          .Distinct()
          .ToList();

      var userIdsByParticipant = _context.Users
          .Where(u => participants.Select(p => p.UserId).Contains(u.Id))
          .Select(u => new { u.Id, u.ClerkId })
          .ToList()
          .ToDictionary(x => x.Id, x => x.ClerkId);

      return participants
          .Where(p => userIdsByParticipant.TryGetValue(p.UserId, out var clerkId) && joinedUserIds.Contains(clerkId))
          .Select(p => p.Id)
          .ToList();
    }
  }
}
