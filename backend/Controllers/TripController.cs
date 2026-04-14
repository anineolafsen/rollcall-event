using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;
using Microsoft.AspNetCore.Authorization;
namespace MyApp.API.Controllers
{
  [ApiController]
  [Route("api/trips")]
  public class TripController : ControllerBase
  {
    private readonly TripService _tripService;
    private readonly EventService _eventService;

    public TripController(TripService tripService, EventService eventService)
    {
      _tripService = tripService;
      _eventService = eventService;
    }



    [HttpGet]
    public IActionResult GetTrips()
    {
      return Ok(_tripService.GetAllTrips());
    }

    // GET api/trips/my will now only return trips for the current cclerk user that is being used
    [HttpGet("my")]
    [Authorize]
    public IActionResult GetMyTrips()
    {
      return Ok();
    }

    [HttpGet("{id}")]
    public IActionResult GetTripById(int id)
    {
      var trip = _tripService.GetTripById(id);
      if (trip == null)
      {
        return NotFound();
      }
      return Ok(trip);
    }

    [HttpGet("{id}/events")]
    public IActionResult GetTripEvents(int id)
    {
      var trip = _tripService.GetTripById(id);
      if (trip == null)
      {
        return NotFound();
      }

      return Ok(_eventService.GetEventsByTrip(id));
    }

    [HttpPost]
    public IActionResult CreateTrip([FromBody] Trip trip)
    {
      try
      {
        return Ok(_tripService.CreateTrip(trip));
      }
      catch (InvalidOperationException ex)
      {
        return BadRequest(new { error = ex.Message });
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { error = "An unexpected error occurred.", details = ex.Message });
      }
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteTrip(int id)
    {
      var deleted = _tripService.DeleteTrip(id);
      if (!deleted)
      {
        return NotFound();
      }
      return NoContent();
    }
  }
}
