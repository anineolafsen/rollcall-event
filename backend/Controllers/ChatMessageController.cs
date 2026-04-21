using Microsoft.AspNetCore.Mvc;
using MyApp.API.Models;
using MyApp.API.Services;

namespace MyApp.API.Controllers
{
  [ApiController]
  [Route("api/chat-messages")]
  public class ChatMessageController : ControllerBase
  {
    private readonly ChatMessageService _messageService;
    private readonly ChatService _chatService;

    public ChatMessageController(ChatMessageService messageService, ChatService chatService)
    {
      _messageService = messageService;
      _chatService = chatService;
    }

    [HttpGet("chat/{chatId}")]
    public IActionResult GetMessagesByChat(int chatId)
    {
      var chat = _chatService.GetChatById(chatId);
      if (chat == null)
      {
        return NotFound("Chat not found.");
      }

      var messages = _messageService.GetMessagesByChat(chatId);
      return Ok(messages);
    }

    [HttpGet("{id}")]
    public IActionResult GetMessageById(int id)
    {
      var message = _messageService.GetMessageById(id);
      if (message == null)
      {
        return NotFound();
      }

      return Ok(message);
    }

    [HttpPost]
    public IActionResult AddMessage([FromBody] ChatMessage message)
    {
      // Trim and validate content
      if (message.Content != null)
      {
        message.Content = message.Content.Trim();
      }

      if (string.IsNullOrWhiteSpace(message.Content) || string.IsNullOrWhiteSpace(message.SenderEmail))
      {
        return BadRequest("Content and SenderEmail are required.");
      }

      var chat = _chatService.GetChatById(message.ChatID);
      if (chat == null)
      {
        return BadRequest("Chat not found.");
      }

      var createdMessage = _messageService.AddMessage(message);
      return CreatedAtAction(nameof(GetMessageById), new { id = createdMessage.MessageID }, createdMessage);
    }

    [HttpPut("{id}")]
    public IActionResult UpdateMessage(int id, [FromBody] ChatMessage message)
        {
            if (string.IsNullOrWhiteSpace(message.Content))
            {
                return BadRequest("Content cannot be empty.");
            }

            var updatedMessage = _messageService.UpdateMessage(id, message.Content);
            if (updatedMessage == null)
            {
                return NotFound();
            }

            return Ok(updatedMessage);
        }
        

    [HttpDelete("{id}")]
    public IActionResult DeleteMessage(int id)
    {
      var success = _messageService.DeleteMessage(id);
      if (!success)
      {
        return NotFound();
      }

      return NoContent();
    }
  }
}
