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

    public ParticipantController(ParticipantService participantService, UserService userService)
    {
      _participantService = participantService;
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

    [HttpGet("trip/{tripId}")]
    public IActionResult GetParticipantsByTrip(int tripId)
    {
      var participants = _participantService.GetByTrip(tripId);
      return Ok(participants);
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
