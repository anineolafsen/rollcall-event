using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;
using Microsoft.AspNetCore.Authorization;
using MyApp.API.Extensions;

namespace MyApp.API.Controllers
{
  [ApiController]
  [Route("api/trips")]
  public class TripController : ControllerBase
  {
    private readonly TripService _tripService;
    private readonly EventService _eventService;
    private readonly UserService _userService;

    public TripController(TripService tripService, EventService eventService, UserService userService)
    {
      _tripService = tripService;
      _eventService = eventService;
      _userService = userService;
    }

    [HttpGet]
    public IActionResult GetTrips()
    {
      return Ok(_tripService.GetAllTrips());
    }

    // GET api/trips/my returns only trips for the authenticated user
    [HttpGet("my")]
    [Authorize]
    public IActionResult GetMyTrips()
    {
      var clerkId = User.GetClerkId();
      if (clerkId == null) return Unauthorized();

      var user = _userService.GetByClerkId(clerkId);
      if (user == null) return Unauthorized("User not found.");

      return Ok(_tripService.GetTripsByUser(user.Id));
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
    [Authorize]
    public IActionResult CreateTrip([FromBody] Trip trip)
    {
      try
      {
        var clerkId = User.GetClerkId();
        if (clerkId == null) return Unauthorized();

        var user = _userService.GetByClerkId(clerkId);
        if (user == null) return Unauthorized("User not found.");

        trip.OrganizerID = user.Id;

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

    [HttpPut("{id}")]
    public IActionResult UpdateTrip(int id, [FromBody] Trip trip)
    {
      try
      {
        var updatedTrip = _tripService.UpdateTrip(id, trip);
        if (updatedTrip == null)
        {
          return NotFound();
        }
        return Ok(updatedTrip);
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
