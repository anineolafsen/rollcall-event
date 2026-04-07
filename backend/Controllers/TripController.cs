using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;

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

    [HttpGet]
    public IActionResult GetTrips()
    {
      return Ok(_tripService.GetAllTrips());
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