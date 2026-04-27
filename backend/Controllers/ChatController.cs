using Microsoft.AspNetCore.Mvc;
using MyApp.API.Models;
using MyApp.API.Services;
using Microsoft.AspNetCore.Authorization;
using MyApp.API.Extensions;

namespace MyApp.API.Controllers
{
  [ApiController]
  [Route("api/chats")]
  [Authorize] // Enforce authentication for all chat actions
  public class ChatController : ControllerBase
  {
    private readonly ChatService _chatService;
    private readonly UserService _userService;

    public ChatController(ChatService chatService, UserService userService)
    {
      _chatService = chatService;
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
    public IActionResult GetChatsByTrip(int tripId)
    {
      if (!_chatService.TripExists(tripId))
      {
        return NotFound("Trip not found.");
      }

      var chats = _chatService.GetChatsByTrip(tripId);
      return Ok(chats);
    }

    [HttpGet("{id}")]
    public IActionResult GetChatById(int id)
    {
      var chat = _chatService.GetChatById(id);
      if (chat == null)
      {
        return NotFound();
      }

      return Ok(chat);
    }

    [HttpPost]
    public IActionResult CreateChat([FromBody] Chat chat)
    {
      try
      {
        var user = GetAuthenticatedUser();

        if (string.IsNullOrWhiteSpace(chat.Title))
        {
          return BadRequest("Title is required.");
        }

        if (!_chatService.TripExists(chat.TripId))
        {
          return BadRequest("Trip not found.");
        }

        // Set the creator to the authenticated user
        chat.CreatorId = user.Email;
        
        var createdChat = _chatService.CreateChat(chat);
        return CreatedAtAction(nameof(GetChatById), new { id = createdChat.Id }, createdChat);
      }
      catch (UnauthorizedAccessException)
      {
        return Unauthorized();
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { error = ex.Message });
      }
    }

    [HttpPut("{id}")]
    public IActionResult UpdateChat(int id, [FromBody] Chat chat)
    {
      var updatedChat = _chatService.UpdateChat(id, chat);
      if (updatedChat == null)
      {
        return NotFound();
      }

      return Ok(updatedChat);
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteChat(int id)
    {
      var success = _chatService.DeleteChat(id);
      if (!success)
      {
        return NotFound();
      }

      return NoContent();
    }
  }
}
