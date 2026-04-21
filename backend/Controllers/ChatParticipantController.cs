using Microsoft.AspNetCore.Mvc;
using MyApp.API.Models;
using MyApp.API.Services;

namespace MyApp.API.Controllers
{
  [ApiController]
  [Route("api/chat-participants")]
  public class ChatParticipantController : ControllerBase
  {
    private readonly ChatParticipantService _participantService;
    private readonly ChatService _chatService;

    public ChatParticipantController(ChatParticipantService participantService, ChatService chatService)
    {
      _participantService = participantService;
      _chatService = chatService;
    }

    [HttpGet("chat/{chatId}")]
    public IActionResult GetParticipantsByChat(int chatId)
    {
      var chat = _chatService.GetChatById(chatId);
      if (chat == null)
      {
        return NotFound("Chat not found.");
      }

      var participants = _participantService.GetParticipantsByChat(chatId);
      return Ok(participants);
    }

    [HttpPost]
    public IActionResult AddParticipant([FromBody] AddParticipantRequest request)
    {
      if (string.IsNullOrWhiteSpace(request.UserEmail))
      {
        return BadRequest("UserEmail is required.");
      }

      var chat = _chatService.GetChatById(request.ChatID);
      if (chat == null)
      {
        return BadRequest("Chat not found.");
      }

      if (_participantService.ParticipantExists(request.ChatID, request.UserEmail))
      {
        return BadRequest("User is already a participant in this chat.");
      }

      var participant = _participantService.AddParticipant(request.ChatID, request.UserEmail);
      return CreatedAtAction(nameof(GetParticipantsByChat), new { chatId = request.ChatID }, participant);
    }

    [HttpDelete("{chatId}/{userEmail}")]
    public IActionResult RemoveParticipant(int chatId, string userEmail)
    {
      var success = _participantService.RemoveParticipant(chatId, userEmail);
      if (!success)
      {
        return NotFound();
      }

      return NoContent();
    }
  }

  public class AddParticipantRequest
  {
    public int ChatID { get; set; }
    public string UserEmail { get; set; } = string.Empty;
  }
}
