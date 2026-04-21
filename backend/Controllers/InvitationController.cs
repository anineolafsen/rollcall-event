using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;
using Microsoft.AspNetCore.Authorization;
using MyApp.API.Extensions;

namespace MyApp.API.Controllers
{
    [ApiController]
    [Route("api/invitations")]

    public class InvitationController : ControllerBase
    {
        private readonly InvitationService _invitationService;
        private readonly UserService _userService;

        public InvitationController(InvitationService invitationService, UserService userService)
        {
            _invitationService = invitationService;
            _userService = userService;
        }

        [HttpGet]
        public IActionResult GetInvitations([FromQuery] string? email, [FromQuery] int? tripId)
        {
            if (!string.IsNullOrEmpty(email))
            {
                var invitations = _invitationService.GetByEmail(email);
                return Ok(invitations);
            }

            if (tripId.HasValue)
            {
                var invitations = _invitationService.GetByTripId(tripId.Value);
                return Ok(invitations);
            }

            return BadRequest("Either email or tripId query parameter is required");
        }

        // Securely get invitations for the logged-in user
        [HttpGet("my")]
        [Authorize]
        public IActionResult GetMyInvitations()
        {
            var clerkId = User.GetClerkId();
            if (clerkId == null) return Unauthorized();

            var user = _userService.GetByClerkId(clerkId);
            if (user == null) return Unauthorized("User not found.");

            // Use email from internal User record to find invitations
            var invitations = _invitationService.GetByEmail(user.Email);
            return Ok(invitations);
        }

        [HttpPost]
        public IActionResult PostInvitation([FromBody] Invitation invitation)
        {
            return Ok(_invitationService.AddInvitation(invitation));
        }

        [HttpPost("accept")]
        [Authorize]
        public IActionResult AcceptInvitation([FromQuery] int invitationId)
        {
            var clerkId = User.GetClerkId();
            if (clerkId == null) return Unauthorized();

            var user = _userService.GetByClerkId(clerkId);
            if (user == null) return Unauthorized("User not found.");

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
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest("Email query parameter is required");
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
