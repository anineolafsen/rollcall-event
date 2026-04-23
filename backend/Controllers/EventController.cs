using Microsoft.AspNetCore.Mvc;
using MyApp.API.Models;
using MyApp.API.Services;
using Microsoft.AspNetCore.Authorization;
using MyApp.API.Extensions;

namespace MyApp.API.Controllers
{
  [ApiController]
  [Route("api/events")]
  [Authorize] // Enforce authentication for all event actions
  public class EventController : ControllerBase
  {
    private readonly EventService _eventService;
    private readonly TripService _tripService;
    private readonly UserService _userService;

    public EventController(EventService eventService, TripService tripService, UserService userService)
    {
      _eventService = eventService;
      _tripService = tripService;
      _userService = userService;
    }

    private User GetAuthenticatedUser()
    {
        var clerkId = User.GetClerkId();
        var email = User.GetEmail();
        if (string.IsNullOrEmpty(clerkId) || string.IsNullOrEmpty(email))
            throw new UnauthorizedAccessException("Identity claims missing from token.");

        return _userService.GetOrCreateUser(clerkId, email);
    }

    [HttpGet("{id}")]
    public IActionResult GetEventById(int id)
    {
      var appEvent = _eventService.GetEventById(id);
      if (appEvent == null) return NotFound();

      var user = GetAuthenticatedUser();
      
      // SECURITY: Check if user has access to the trip that the event belongs to
      if (!_tripService.UserHasAccessToTrip(appEvent.TripId, user.Id))
      {
          return Forbid();
      }

      // Return event + permission context
      return Ok(new {
          appEvent.Id,
          appEvent.Name,
          appEvent.Location,
          appEvent.StartDate,
          appEvent.EndDate,
          appEvent.Description,
          appEvent.Capacity,
          appEvent.HasUnlimitedCapacity,
          appEvent.AttendanceMode,
          appEvent.TripId,
          IsOrganizer = _tripService.UserIsOrganizer(appEvent.TripId, user.Id)
      });
    }

    [HttpPost]
    public IActionResult CreateEvent([FromBody] Event appEvent)
    {
      var user = GetAuthenticatedUser();

      // SECURITY: Restrict so only trip organizers can create events in the trip
      if (!_tripService.UserIsOrganizer(appEvent.TripId, user.Id))
      {
          return Forbid();
      }

      if (!_eventService.TripExists(appEvent.TripId))
      {
        return BadRequest("Trip not found.");
      }

      return Ok(_eventService.CreateEvent(appEvent));
    }

    [HttpPut("{id}")]
    public IActionResult UpdateEvent(int id, [FromBody] Event appEvent)
    {
      var existingEvent = _eventService.GetEventById(id);
      if (existingEvent == null) return NotFound();

      var user = GetAuthenticatedUser();

      // SECURITY: Only trip organizers can update events
      if (!_tripService.UserIsOrganizer(existingEvent.TripId, user.Id) || 
          !_tripService.UserIsOrganizer(appEvent.TripId, user.Id))
      {
          return Forbid();
      }

      if (!_eventService.TripExists(appEvent.TripId))
      {
        return BadRequest("Trip not found.");
      }

      var updatedEvent = _eventService.UpdateEvent(id, appEvent);
      if (updatedEvent == null)
      {
        return NotFound();
      }

      return Ok(updatedEvent);
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteEvent(int id)
    {
      var appEvent = _eventService.GetEventById(id);
      if (appEvent == null) return NotFound();

      var user = GetAuthenticatedUser();

      // SECURITY: Only trip organizers can delete events
      if (!_tripService.UserIsOrganizer(appEvent.TripId, user.Id))
      {
          return Forbid();
      }

      var deleted = _eventService.DeleteEvent(id);
      if (!deleted)
      {
        return NotFound();
      }

      return NoContent();
    }
  }
}
