using MyApp.API.Data;
using MyApp.API.Models;

namespace MyApp.API.Services
{
  public class ChatMessageService
  {
    private readonly AppDbContext _context;

    public ChatMessageService(AppDbContext context)
    {
      _context = context;
    }

    public List<ChatMessage> GetMessagesByChat(int chatId)
    {
      return _context.ChatMessages
        .Where(m => m.ChatId == chatId)
        .OrderBy(m => m.Timestamp)
        .ToList();
    }

    public ChatMessage? GetMessageById(int messageId)
    {
      return _context.ChatMessages.FirstOrDefault(m => m.Id == messageId);
    }

    public ChatMessage AddMessage(ChatMessage message)
    {
      message.Timestamp = DateTime.UtcNow;
      _context.ChatMessages.Add(message);
      _context.SaveChanges();
      return message;
    }

    public ChatMessage? UpdateMessage(int messageId, string newContent)
        {
            var message = _context.ChatMessages.FirstOrDefault(m => m.Id == messageId);
            if (message == null)
            {
                return null;
            }

            message.Content = newContent.Trim();
            if (string.IsNullOrWhiteSpace(message.Content))
            {
                return null;
            }

            _context.ChatMessages.Update(message);
            _context.SaveChanges();
            return message;
        }

    public bool DeleteMessage(int messageId)
    {
      var message = _context.ChatMessages.FirstOrDefault(m => m.Id == messageId);
      if (message == null)
      {
        return false;
      }

      _context.ChatMessages.Remove(message);
      _context.SaveChanges();
      return true;
    }
  }
}
