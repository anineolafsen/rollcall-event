using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.API.Services;

namespace MyApp.API.Controllers
{
    public class SendMessageRequest
    {
        public int SenderParticipantId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/messages")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly MessageService _messageService;

        public MessagesController(MessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpGet("event/{eventId}")]
        public IActionResult GetByEvent(int eventId)
        {
            var messages = _messageService.GetByEvent(eventId);
            return Ok(messages);
        }

        [HttpPost("event/{eventId}")]
        public IActionResult Send(int eventId, [FromBody] SendMessageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Body))
                return BadRequest(new { message = "Message body cannot be empty." });

            var (message, error) = _messageService.Send(
                eventId,
                request.SenderParticipantId,
                request.SenderName,
                request.Body
            );

            if (message == null)
                return BadRequest(new { message = error });

            return Ok(message);
        }
    }
}
