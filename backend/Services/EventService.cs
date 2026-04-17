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

    public List<Event> GetAllEvents()
    {
      return _context.Events.ToList();
    }

    public List<Event> GetEventsByTrip(int tripId)
    {
      return _context.Events
        .Where(e => e.TripID == tripId)
        .OrderBy(e => e.StartDate)
        .ToList();
    }

    public Event? GetEventById(int id)
    {
      return _context.Events.FirstOrDefault(e => e.EventID == id);
    }

    public bool TripExists(int tripId)
    {
      return _context.Trips.Any(t => t.TripID == tripId);
    }

    public Event CreateEvent(Event appEvent)
    {
      appEvent.EventID = GenerateUniqueEventId();
      _context.Events.Add(appEvent);
      _context.SaveChanges();
      return appEvent;
    }

    public Event? UpdateEvent(int id, Event updatedEvent)
    {
      var existingEvent = _context.Events.FirstOrDefault(e => e.EventID == id);
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
      existingEvent.TripID = updatedEvent.TripID;

      _context.SaveChanges();
      return existingEvent;
    }

    public bool DeleteEvent(int id)
    {
      var appEvent = _context.Events.FirstOrDefault(e => e.EventID == id);
      if (appEvent == null)
      {
        return false;
      }

      _context.Events.Remove(appEvent);
      _context.SaveChanges();
      return true;
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

        var exists = _context.Events.Any(e => e.EventID == id);
        if (!exists)
        {
          return id;
        }
      }
    }
  }
}
