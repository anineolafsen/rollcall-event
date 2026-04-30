using Microsoft.AspNetCore.Mvc;
using MyApp.API.Models;
using MyApp.API.Services;
using Microsoft.AspNetCore.Authorization;

namespace MyApp.API.Controllers
{
  public record AddChatParticipantRequest(int ChatId, int UserId);

  [ApiController]
  [Route("api/chat-participants")]
  [Authorize]
  public class ChatParticipantController : ControllerBase
  {
    private readonly ChatParticipantService _participantService;
    private readonly ChatService _chatService;
    private readonly UserService _userService;

    public ChatParticipantController(ChatParticipantService participantService, ChatService chatService, UserService userService)
    {
      _participantService = participantService;
      _chatService = chatService;
      _userService = userService;
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
    public IActionResult AddParticipant([FromBody] AddChatParticipantRequest request)
    {
      try
      {
        if (request.UserId <= 0)
        {
          return BadRequest("UserId is required.");
        }

        var chat = _chatService.GetChatById(request.ChatId);
        if (chat == null)
        {
          return BadRequest("Chat not found.");
        }

        if (_participantService.ParticipantExistsByUserId(request.ChatId, request.UserId))
        {
          return BadRequest("User is already a participant in this chat.");
        }

        var participant = _participantService.AddParticipantByUserId(request.ChatId, request.UserId);
        return CreatedAtAction(nameof(GetParticipantsByChat), new { chatId = request.ChatId }, participant);
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { error = ex.Message });
      }
    }

    [HttpDelete("{chatId}/{userId}")]
    public IActionResult RemoveParticipant(int chatId, int userId)
    {
      try
      {
        var success = _participantService.RemoveParticipant(chatId, userId);
        if (!success)
        {
          return NotFound();
        }

        return NoContent();
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { error = ex.Message });
      }
    }
  }
}
