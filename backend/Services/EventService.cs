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
      return events.Select(e => EnrichEvent(e, userId)).ToList();
    }

    private Event EnrichEvent(Event appEvent, string? userId)
    {
      var participantCount = _context.EventParticipants.Count(ep => ep.EventID == appEvent.Id);
      var tripParticipantCount = _context.Participants.Count(p => p.TripId == appEvent.TripId);
      var isJoined = !string.IsNullOrWhiteSpace(userId) &&
        _context.EventParticipants.Any(ep => ep.EventID == appEvent.Id && ep.UserID == userId);

      appEvent.ParticipantCount = participantCount;
      appEvent.TripParticipantCount = tripParticipantCount;
      appEvent.IsJoined = isJoined;

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
