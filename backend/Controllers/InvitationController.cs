using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;

namespace MyApp.API.Controllers
{
    [ApiController]
    [Route("api/invitations")]

    public class InvitationController : ControllerBase
    {
        private readonly InvitationService _invitationService;

        public InvitationController(InvitationService invitationService)
        {
            _invitationService = invitationService;
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

        [HttpPost]
        public IActionResult PostInvitation([FromBody] Invitation invitation)
        {
            return Ok(_invitationService.AddInvitation(invitation));
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
