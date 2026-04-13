using MyApp.API.Data;
using MyApp.API.Models;

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

    public Event? GetEventById(int id)
    {
      return _context.Events.FirstOrDefault(e => e.EventID == id);
    }

    public Event CreateEvent(Event appEvent)
    {
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
  }
}
