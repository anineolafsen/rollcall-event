using Microsoft.AspNetCore.Mvc;
using MyApp.API.Models;
using MyApp.API.Services;

namespace MyApp.API.Controllers
{
  [ApiController]
  [Route("api/events")]
  public class EventController : ControllerBase
  {
    private readonly EventService _eventService;

    public EventController(EventService eventService)
    {
      _eventService = eventService;
    }

    [HttpGet]
    public IActionResult GetEvents()
    {
      return Ok(_eventService.GetAllEvents());
    }

    [HttpGet("{id}")]
    public IActionResult GetEventById(int id)
    {
      var appEvent = _eventService.GetEventById(id);
      if (appEvent == null)
      {
        return NotFound();
      }

      return Ok(appEvent);
    }

    [HttpPost]
    public IActionResult CreateEvent([FromBody] Event appEvent)
    {
      if (!_eventService.TripExists(appEvent.TripId))
      {
        return BadRequest("Trip not found.");
      }

      return Ok(_eventService.CreateEvent(appEvent));
    }

    [HttpPut("{id}")]
    public IActionResult UpdateEvent(int id, [FromBody] Event appEvent)
    {
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
      var deleted = _eventService.DeleteEvent(id);
      if (!deleted)
      {
        return NotFound();
      }

      return NoContent();
    }
  }
}
