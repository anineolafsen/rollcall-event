using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;
using MyApp.API.Models;
using System.Runtime.Versioning;

namespace MyApp.API.Controllers
{
    [ApiController]
    [Route("api/participants")]

    public class ParticipantController : ControllerBase
    {
        private readonly ParticipantService _participantService;

        public ParticipantController(ParticipantService participantService)
        {
            _participantService = participantService;
        }

        [HttpGet("trip/{tripId}")]
        public IActionResult GetParticipantsByTrip(int tripId)
        {
            var participants = _participantService.GetByTrip(tripId);
            return Ok(participants);
        }

        [HttpPost]
        public IActionResult PostParticipant([FromBody] Participant participant)
        {
            return Ok(_participantService.AddParticipant(participant));
        }
    }
}