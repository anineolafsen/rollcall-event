using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MyApp.API.Models;
using MyApp.API.Services;
using MyApp.API.Extensions;

namespace MyApp.API.Controllers
{
  public class StartCheckinSessionRequest
  {
    public string SessionType { get; set; } = "self";
    public int? QrTokenLifetimeMinutes { get; set; }
  }

  public class ValidateQrCheckinRequest
  {
    public string Token { get; set; } = string.Empty;
    public int ParticipantID { get; set; }
  }

  [ApiController]
  [Route("api/checkins")]
  [Authorize]
  public class CheckinController : ControllerBase
  {
    private readonly CheckinService _checkinService;

    public CheckinController(CheckinService checkinService)
    {
      _checkinService = checkinService;
    }

    // The organizer starts a check-in session for one spesific eventId (either self or qr)
    [HttpPost("sessions/start/{eventId}")]
    public IActionResult StartCheckinSession(int eventId, [FromBody] StartCheckinSessionRequest? request)
    {
      var sessionTypeRaw = request?.SessionType?.Trim().ToLowerInvariant() ?? "self";
      var sessionType = sessionTypeRaw == "qr" ? CheckinSessionType.Qr : CheckinSessionType.Self;
      var tokenLifetime = request?.QrTokenLifetimeMinutes ?? 15;

      var result = _checkinService.StartSession(eventId, sessionType, tokenLifetime);
      if (result.Session == null)
      {
        return NotFound(new { message = result.Error });
      }

      var userIdsToNotify = _checkinService.GetParticipantUserIdsToNotify(eventId);

      return Ok(new
      {
        sessionId = result.Session.SessionID,
        result.Session.EventID,
        sessionType = result.Session.SessionType.ToString().ToLowerInvariant(),
        result.Session.Token,
        result.Session.ExpiresAt,
        result.Session.StartedAt,
        participantsToNotify = userIdsToNotify,
      });
    }

    //Stopping a check-in session
    [HttpPost("sessions/stop/{eventId}/{sessionType}")]
    public IActionResult StopCheckinSession(int eventId, string sessionType)
    {
      var normalizedType = sessionType.Trim().ToLowerInvariant();
      var parsedType = normalizedType == "qr" ? CheckinSessionType.Qr : CheckinSessionType.Self;

      var stopped = _checkinService.StopSession(eventId, parsedType);
      if (!stopped)
      {
        return NotFound(new { message = "No active session found for this event and session type." });
      }

      return Ok(new { message = "Session stopped." });
    }

    //checks if there is an active checkin session for the eventId
    [HttpGet("sessions/active/{eventId}/{sessionType}")]
    public IActionResult GetActiveSessionForEvent(int eventId, string sessionType)
    {
      var normalizedType = sessionType.Trim().ToLowerInvariant();
      var parsedType = normalizedType == "qr" ? CheckinSessionType.Qr : CheckinSessionType.Self;

      var session = _checkinService.GetActiveSession(eventId, parsedType);
      if (session == null)
      {
        return Ok(new { isActive = false });
      }

      return Ok(new
      {
        isActive = true,
        sessionId = session.SessionID,
        sessionType = session.SessionType.ToString().ToLowerInvariant(),
        session.Token,
        session.ExpiresAt,
        session.StartedAt,
      });
    }

    // Participants can call this on launch to know if any check-in modal should be shown 
    [HttpGet("sessions/active-for-user/{userId}")]
    public IActionResult GetActiveSessionsForUser(string userId)
    {
      var clerkId = User.GetClerkId();
      if (string.IsNullOrWhiteSpace(clerkId))
      {
        return Unauthorized("Authenticated user ID not found.");
      }

      var activeEventIds = _checkinService.GetActiveCheckinEventIdsForUser(clerkId);
      return Ok(new { eventIds = activeEventIds });
    }

    //Return participants and their checked in status
    [HttpGet("events/{eventId}/participants")]
    public IActionResult GetEventParticipantStatuses(int eventId)
    {
      var statuses = _checkinService.GetEventParticipantStatuses(eventId);
      return Ok(statuses);
    }

    // Participant self check-in endpoint so they can check in
    [HttpPost("events/{eventId}/participants/{participantId}")]
    public IActionResult CheckInParticipantForEvent(int eventId, int participantId)
    {
      _checkinService.CheckInParticipant(eventId, participantId);
      return Ok(new { message = "Check-in operation completed." });
    }

    //For un-checking-in a participant
    [HttpDelete("events/{eventId}/participants/{participantId}")]
    public IActionResult UncheckInParticipantForEvent(int eventId, int participantId)
    {
      _checkinService.UncheckInParticipant(eventId, participantId);
      return Ok(new { message = "Uncheck operation completed." });
    }

    // Participant QR check-in endpoint (same backend session model as normal check-in)
    [HttpPost("sessions/qr/validate")]
    public IActionResult ValidateQrCheckin([FromBody] ValidateQrCheckinRequest request)
    {
      _checkinService.ValidateQrAndCheckin(request.Token, request.ParticipantID);
      return Ok(new { message = "QR check-in operation completed." });
    }
  }
}