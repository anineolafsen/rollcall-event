using MyApp.API.Data;
using MyApp.API.Models;
using System.Security.Cryptography;

namespace MyApp.API.Services
{
  public class EventService
  {
    private readonly AppDbContext _context;

    public EventService(AppDbContext context)
    {
      _context = context;
    }

    public List<Event> GetAllEvents(string? userId = null)
    {
      var events = _context.Events.OrderBy(e => e.StartDate).ToList();
      return EnrichEvents(events, userId);
    }

    public List<Event> GetEventsByTrip(int tripId, string? userId = null)
    {
      var events = _context.Events
        .Where(e => e.TripId == tripId)
        .OrderBy(e => e.StartDate)
        .ToList();

      return EnrichEvents(events, userId);
    }

    public List<Event> GetEventsByUser(string userId)
    {
      var user = _context.Users.FirstOrDefault(u => u.ClerkId == userId);
      if (user == null)
      {
        return new List<Event>();
      }

      var events = _context.Events
        .Where(eventItem =>
          _context.Participants.Any(participant =>
            participant.TripId == eventItem.TripId &&
            participant.UserId == user.Id))
        .OrderBy(eventItem => eventItem.StartDate)
        .ToList();

      return EnrichEvents(events, userId);
    }

    public Event? GetEventById(int id, string? userId = null)
    {
      var appEvent = _context.Events.FirstOrDefault(e => e.Id == id);
      if (appEvent == null)
      {
        return null;
      }

      return EnrichEvent(appEvent, userId);
    }

    public bool TripExists(int tripId)
    {
      return _context.Trips.Any(t => t.Id == tripId);
    }

    public Event CreateEvent(Event appEvent)
    {
      appEvent.Id = GenerateUniqueEventId();
      _context.Events.Add(appEvent);
      _context.SaveChanges();
      return EnrichEvent(appEvent, null);
    }

    public Event? UpdateEvent(int id, Event updatedEvent)
    {
      var existingEvent = _context.Events.FirstOrDefault(e => e.Id == id);
      if (existingEvent == null)
      {
        return null;
      }

      existingEvent.Name = updatedEvent.Name;
      existingEvent.Location = updatedEvent.Location;
      existingEvent.StartDate = updatedEvent.StartDate;
      existingEvent.EndDate = updatedEvent.EndDate;
      existingEvent.Description = updatedEvent.Description;
      existingEvent.Capacity = updatedEvent.Capacity;
      existingEvent.HasUnlimitedCapacity = updatedEvent.HasUnlimitedCapacity;
      existingEvent.AttendanceMode = updatedEvent.AttendanceMode;
      existingEvent.TripId = updatedEvent.TripId;

      _context.SaveChanges();
      return EnrichEvent(existingEvent, null);
    }

    public bool DeleteEvent(int id)
    {
      var appEvent = _context.Events.FirstOrDefault(e => e.Id == id);
      if (appEvent == null)
      {
        return false;
      }

      _context.Events.Remove(appEvent);
      _context.SaveChanges();
      return true;
    }

    public Event? JoinEvent(int eventId, string userId)
    {
      var appEvent = _context.Events.FirstOrDefault(e => e.Id == eventId);
      if (appEvent == null)
      {
        return null;
      }

      if (appEvent.AttendanceMode == "mandatory")
      {
        return EnrichEvent(appEvent, userId);
      }

      var alreadyJoined = _context.EventParticipants.Any(ep => ep.EventID == eventId && ep.UserID == userId);
      if (alreadyJoined)
      {
        return EnrichEvent(appEvent, userId);
      }

      var currentCount = _context.EventParticipants.Count(ep => ep.EventID == eventId);
      if (!appEvent.HasUnlimitedCapacity && appEvent.Capacity.HasValue && currentCount >= appEvent.Capacity.Value)
      {
        return null;
      }

      _context.EventParticipants.Add(new EventParticipant
      {
        EventID = eventId,
        UserID = userId
      });

      _context.SaveChanges();
      return EnrichEvent(appEvent, userId);
    }

    public Event? LeaveEvent(int eventId, string userId)
    {
      var appEvent = _context.Events.FirstOrDefault(e => e.Id == eventId);
      if (appEvent == null)
      {
        return null;
      }

      var participant = _context.EventParticipants
        .FirstOrDefault(ep => ep.EventID == eventId && ep.UserID == userId);

      if (participant != null)
      {
        _context.EventParticipants.Remove(participant);
        _context.SaveChanges();
      }

      return EnrichEvent(appEvent, userId);
    }

    private List<Event> EnrichEvents(List<Event> events, string? userId)
    {
      if (events.Count == 0)
      {
        return events;
      }

      var eventIds = events.Select(e => e.Id).Distinct().ToList();
      var tripIds = events.Select(e => e.TripId).Distinct().ToList();

      var participantCounts = _context.EventParticipants
        .Where(ep => eventIds.Contains(ep.EventID))
        .GroupBy(ep => ep.EventID)
        .Select(g => new { EventID = g.Key, Count = g.Count() })
        .ToDictionary(x => x.EventID, x => x.Count);

      var tripParticipantCounts = _context.Participants
        .Where(p => tripIds.Contains(p.TripId))
        .GroupBy(p => p.TripId)
        .Select(g => new { TripId = g.Key, Count = g.Count() })
        .ToDictionary(x => x.TripId, x => x.Count);

      var activeSelfSessionEventIds = _context.EventCheckinSessions
        .Where(session =>
          eventIds.Contains(session.EventID) &&
          session.IsActive &&
          session.SessionType == CheckinSessionType.Self)
        .Select(session => session.EventID)
        .Distinct()
        .ToHashSet();

      HashSet<int> joinedEventIds = new();
      if (!string.IsNullOrWhiteSpace(userId))
      {
        joinedEventIds = _context.EventParticipants
          .Where(ep => ep.UserID == userId && eventIds.Contains(ep.EventID))
          .Select(ep => ep.EventID)
          .Distinct()
          .ToHashSet();
      }

      foreach (var appEvent in events)
      {
        var isJoined = joinedEventIds.Contains(appEvent.Id);

        appEvent.ParticipantCount = participantCounts.TryGetValue(appEvent.Id, out var participantCount)
          ? participantCount
          : 0;
        appEvent.TripParticipantCount = tripParticipantCounts.TryGetValue(appEvent.TripId, out var tripParticipantCount)
          ? tripParticipantCount
          : 0;
        appEvent.IsJoined = isJoined;
        appEvent.IsSelfCheckinActive = activeSelfSessionEventIds.Contains(appEvent.Id);

        if (appEvent.AttendanceMode == "mandatory")
        {
          appEvent.JoinButtonState = "mandatory";
        }
        else
        {
          appEvent.JoinButtonState = isJoined ? "leave" : "join";
        }
      }

      return events;
    }

    private Event EnrichEvent(Event appEvent, string? userId)
    {
      var participantCount = _context.EventParticipants.Count(ep => ep.EventID == appEvent.Id);
      var tripParticipantCount = _context.Participants.Count(p => p.TripId == appEvent.TripId);
      var isJoined = !string.IsNullOrWhiteSpace(userId) &&
        _context.EventParticipants.Any(ep => ep.EventID == appEvent.Id && ep.UserID == userId);
      var isSelfCheckinActive = _context.EventCheckinSessions.Any(session =>
        session.EventID == appEvent.Id &&
        session.IsActive &&
        session.SessionType == CheckinSessionType.Self);

      appEvent.ParticipantCount = participantCount;
      appEvent.TripParticipantCount = tripParticipantCount;
      appEvent.IsJoined = isJoined;
      appEvent.IsSelfCheckinActive = isSelfCheckinActive;

      if (appEvent.AttendanceMode == "mandatory")
      {
        appEvent.JoinButtonState = "mandatory";
      }
      else
      {
        appEvent.JoinButtonState = isJoined ? "leave" : "join";
      }

      return appEvent;
    }

    private int GenerateUniqueEventId()
    {
      var bytes = new byte[4];

      while (true)
      {
        RandomNumberGenerator.Fill(bytes);
        var id = BitConverter.ToInt32(bytes, 0) & int.MaxValue;

        if (id == 0)
        {
          continue;
        }

        var exists = _context.Events.Any(e => e.Id == id);
        if (!exists)
        {
          return id;
        }
      }
    }
  }
}
