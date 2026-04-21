using Microsoft.AspNetCore.Mvc;
using MyApp.API.Models;
using MyApp.API.Services;

namespace MyApp.API.Controllers
{
  [ApiController]
  [Route("api/chats")]
  public class ChatController : ControllerBase
  {
    private readonly ChatService _chatService;

    public ChatController(ChatService chatService)
    {
      _chatService = chatService;
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
      if (string.IsNullOrWhiteSpace(chat.Title) || string.IsNullOrWhiteSpace(chat.CreatorID))
      {
        return BadRequest("Title and CreatorID are required.");
      }

      if (!_chatService.TripExists(chat.TripID))
      {
        return BadRequest("Trip not found.");
      }

      var createdChat = _chatService.CreateChat(chat);
      return CreatedAtAction(nameof(GetChatById), new { id = createdChat.ChatID }, createdChat);
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
