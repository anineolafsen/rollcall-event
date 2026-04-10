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

    public TripController(TripService tripService)
    {
      _tripService = tripService;
    }

    // Helps to extract the ClerkUserId from JWT claims
    private string? GetClerkUserId()
    {
      var claim = User.Claims.FirstOrDefault(c => c.Type == "sub");
      return claim?.Value;
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
      var clerkUserId = GetClerkUserId();
      if (string.IsNullOrEmpty(clerkUserId))
      {
        return Unauthorized();
      }
      var trips = _tripService.GetTripsForUser(clerkUserId);
      return Ok(trips);
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

    [HttpPost]
    public IActionResult CreateTrip([FromBody] Trip trip)
    {
      return Ok(_tripService.CreateTrip(trip));
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