using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;
using Microsoft.AspNetCore.Authorization;
using MyApp.API.Extensions;

namespace MyApp.API.Controllers
{
  [ApiController]
  [Route("api/trips")]
  [Authorize] // Enforce authentication for all trip actions
  public class TripController : ControllerBase
  {
    private readonly TripService _tripService;
    private readonly EventService _eventService;
    private readonly UserService _userService;
    private readonly InvitationService _invitationService;
    private readonly ParticipantService _participantService;

    public TripController(TripService tripService, EventService eventService, UserService userService, InvitationService invitationService, ParticipantService participantService)
    {
      _tripService = tripService;
      _eventService = eventService;
      _userService = userService;
      _invitationService = invitationService;
      _participantService = participantService;
    }

    private User GetAuthenticatedUser()
    {
        var clerkId = User.GetClerkId();
        var email = User.GetEmail();
        if (string.IsNullOrEmpty(clerkId) || string.IsNullOrEmpty(email))
            throw new UnauthorizedAccessException("Identity claims missing from token.");

        return _userService.GetOrCreateUser(clerkId, email);
    }

    // GET api/trips/my returns only trips for the authenticated user
    [HttpGet("my")]
    public IActionResult GetMyTrips()
    {
      var user = GetAuthenticatedUser();
      var trips = _tripService.GetTripsByUser(user.Id);
      var result = trips.Select(t => new {
        t.Id,
        t.Name,
        t.StartDate,
        t.EndDate,
        t.Destination,
        t.Description,
        IsOrganizer = _tripService.UserIsOrganizer(t.Id, user.Id)
      });
      return Ok(result);
    }

    [HttpGet("{id}")]
    public IActionResult GetTripById(int id)
    {
      var user = GetAuthenticatedUser();

      // SECURITY: Check if user is a participant OR has a pending invitation
      bool isParticipant = _tripService.UserHasAccessToTrip(id, user.Id);
      bool isInvited = _invitationService.UserHasPendingInvitation(id, user.Email);

      if (!isParticipant && !isInvited)
      {
          return Forbid();
      }

      var trip = _tripService.GetTripById(id);
      if (trip == null) return NotFound();

      // Return trip details + permission info to pass to frontend
      return Ok(new {
          trip.Id,
          trip.Name,
          trip.StartDate,
          trip.EndDate,
          trip.Destination,
          trip.Description,
          IsOrganizer = isParticipant && _tripService.UserIsOrganizer(id, user.Id)
      });
    }

    [HttpGet("{id}/events")]
    public IActionResult GetTripEvents(int id)
    {
      var user = GetAuthenticatedUser();

      // SECURITY: Check if user is a participant of this trip
      if (!_tripService.UserHasAccessToTrip(id, user.Id))
      {
          return Forbid();
      }

      return Ok(_eventService.GetEventsByTrip(id));
    }

    [HttpPost]
    public IActionResult CreateTrip([FromBody] Trip trip)
    {
      try
      {
        var user = GetAuthenticatedUser();
        return Ok(_tripService.CreateTrip(trip, user.Id));
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
        var user = GetAuthenticatedUser();

        // SECURITY: Only organizers can update trip details
        if (!_tripService.UserIsOrganizer(id, user.Id))
        {
            return Forbid();
        }

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
      var user = GetAuthenticatedUser();

      // SECURITY: Only organizers can delete trips
      if (!_tripService.UserIsOrganizer(id, user.Id))
      {
          return Forbid();
      }

      var deleted = _tripService.DeleteTrip(id);
      if (!deleted)
      {
        return NotFound();
      }
      return NoContent();
    }

    // GET api/trips/{id}/participants/needs — organizer only
    [HttpGet("{id}/participants/needs")]
    public IActionResult GetParticipantNeeds(int id)
    {
      var user = GetAuthenticatedUser();

      if (!_tripService.UserIsOrganizer(id, user.Id))
          return Forbid();

      var needs = _participantService.GetNeedsByTrip(id);
      return Ok(needs);
    }
  }
}
