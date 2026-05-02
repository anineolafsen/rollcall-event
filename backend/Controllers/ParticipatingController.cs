using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;
using Microsoft.AspNetCore.Authorization;
using MyApp.API.Extensions;

namespace MyApp.API.Controllers
{
  public record UpdateNeedsRequest(string? Allergies, string? OtherInfo);

  [ApiController]
  [Route("api/participants")]
  [Authorize]
  public class ParticipantController : ControllerBase
  {
    private readonly ParticipantService _participantService;
    private readonly UserService _userService;
    private readonly TripService _tripService;

    public ParticipantController(ParticipantService participantService, UserService userService, TripService tripService)
    {
      _participantService = participantService;
      _userService = userService;
      _tripService = tripService;
    }

    private User GetAuthenticatedUser()
    {
      var clerkId = User.GetClerkId();
      var email = User.GetEmail();
      if (string.IsNullOrEmpty(clerkId) || string.IsNullOrEmpty(email))
        throw new UnauthorizedAccessException("Identity claims missing from token.");
      return _userService.GetOrCreateUser(clerkId, email);
    }

    [HttpGet("trip/{tripId}")]
    public IActionResult GetParticipantsByTrip(int tripId)
    {
      var user = GetAuthenticatedUser();

      if (!_tripService.UserHasAccessToTrip(tripId, user.Id))
      {
        return Forbid();
      }

      var participants = _participantService.GetNeedsByTrip(tripId);
      return Ok(participants);
    }

    [HttpGet("trip/{tripId}/contact")]
    public IActionResult GetContactsByTrip(int tripId)
    {
      var user = GetAuthenticatedUser();

      if (!_tripService.UserHasAccessToTrip(tripId, user.Id))
      {
        return Forbid();
      }

      var contacts = _participantService.GetContactsByTrip(tripId);
      return Ok(contacts);
    }

    [HttpGet("my-trips")]
    public IActionResult GetMyTripsWithNeeds()
    {
      var user = GetAuthenticatedUser();
      var tripNeeds = _participantService.GetTripNeedsByUser(user.Id);
      return Ok(tripNeeds);
    }

    [HttpPut("{tripId}/needs")]
    public IActionResult UpdateNeeds(int tripId, [FromBody] UpdateNeedsRequest request)
    {
      var user = GetAuthenticatedUser();
      var success = _participantService.UpdateNeeds(tripId, user.Id, request.Allergies, request.OtherInfo);
      if (!success) return NotFound();
      return NoContent();
    }

    [HttpPost]
    public IActionResult PostParticipant([FromBody] Participant participant)
    {
      return Ok(_participantService.AddParticipant(participant));
    }
  }
}
