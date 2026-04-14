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

        [HttpPost]
        public IActionResult PostInvitation([FromBody] Invitation invitation)
        {
            return Ok(_invitationService.AddInvitation(invitation));
        }
    }
}
