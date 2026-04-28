using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;
using Microsoft.AspNetCore.Authorization;
using MyApp.API.Extensions;

namespace MyApp.API.Controllers
{
    [ApiController]
    [Route("api/invitations")]
    [Authorize] // Enforce authentication for all invitation actions
    public class InvitationController : ControllerBase
    {
        private readonly InvitationService _invitationService;
        private readonly UserService _userService;
        private readonly TripService _tripService;

        public InvitationController(InvitationService invitationService, UserService userService, TripService tripService)
        {
            _invitationService = invitationService;
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

        // Securely get invitations for the logged-in user with auto-onboarding
        [HttpGet("my")]
        public IActionResult GetMyInvitations()
        {
            var user = GetAuthenticatedUser();
            var invitations = _invitationService.GetByEmail(user.Email);
            return Ok(invitations);
        }

        [HttpPost]
        public IActionResult PostInvitation([FromBody] Invitation invitation)
        {
            var user = GetAuthenticatedUser();

            // SECURITY: Only trip organizers can invite others
            if (!_tripService.UserIsOrganizer(invitation.TripId, user.Id))
            {
                return Forbid();
            }

            // SECURITY: Organizer cannot invite themselves
            if (invitation.Email.Equals(user.Email, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { error = "You cannot invite yourself to this trip. You are already a participant as the organizer." });
            }

            return Ok(_invitationService.AddInvitation(invitation));
        }

        [HttpPost("accept")]
        public IActionResult AcceptInvitation([FromQuery] int invitationId)
        {
            // AcceptInvitation handles security by itself by matching the 
            // invitation to the authenticated user's ID
            var user = GetAuthenticatedUser();

            var success = _invitationService.AcceptInvitation(invitationId, user.Id);
            if (!success)
            {
                return NotFound("Invitation not found");
            }
            return Ok();
        }

        [HttpDelete]
        public IActionResult DeleteInvitation([FromQuery] int tripId, [FromQuery] string email)
        {
            var user = GetAuthenticatedUser();

            // SECURITY: Only trip organizers can delete invitations
            if (!_tripService.UserIsOrganizer(tripId, user.Id))
            {
                return Forbid();
            }

            var success = _invitationService.RemoveInvitation(tripId, email);
            if (!success)
            {
                return NotFound("Invitation not found");
            }
            return NoContent();
        }
    }
}
