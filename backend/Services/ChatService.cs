using MyApp.API.Data;
using MyApp.API.Models;

namespace MyApp.API.Services
{
  public class ChatService
  {
    private readonly AppDbContext _context;

    public ChatService(AppDbContext context)
    {
      _context = context;
    }

    public List<Chat> GetChatsByTrip(int tripId)
    {
      return _context.Chats
        .Where(c => c.TripId == tripId)
        .OrderByDescending(c => c.CreatedAt)
        .ToList();
    }

    public Chat? GetChatById(int chatId)
    {
      return _context.Chats.FirstOrDefault(c => c.Id == chatId);
    }

    public bool TripExists(int tripId)
    {
      return _context.Trips.Any(t => t.Id == tripId);
    }

    public Chat CreateChat(Chat chat)
    {
      try
      {
        if (chat == null)
          throw new ArgumentNullException(nameof(chat));
        
        if (string.IsNullOrWhiteSpace(chat.Title))
          throw new ArgumentException("Chat title cannot be empty.");
        
        if (chat.TripId <= 0)
          throw new ArgumentException("Invalid trip ID.");

        _context.Chats.Add(chat);
        _context.SaveChanges();
        return chat;
      }
      catch (Exception ex)
      {
        Console.WriteLine($"[ChatService.CreateChat] Error: {ex.Message}");
        Console.WriteLine($"[ChatService.CreateChat] Stack trace: {ex.StackTrace}");
        throw;
      }
    }

    public Chat? UpdateChat(int chatId, Chat updatedChat)
    {
      var existingChat = _context.Chats.FirstOrDefault(c => c.Id == chatId);
      if (existingChat == null)
      {
        return null;
      }

      existingChat.Title = updatedChat.Title;
      _context.SaveChanges();
      return existingChat;
    }

    public bool DeleteChat(int chatId)
    {
      try
      {
        var chat = _context.Chats.FirstOrDefault(c => c.Id == chatId);
        if (chat == null)
        {
          Console.WriteLine($"[ChatService.DeleteChat] Chat {chatId} not found");
          return false;
        }

        Console.WriteLine($"[ChatService.DeleteChat] Deleting chat {chatId}: {chat.Title}");
        _context.Chats.Remove(chat);
        _context.SaveChanges();
        Console.WriteLine($"[ChatService.DeleteChat] Successfully deleted chat {chatId}");
        return true;
      }
      catch (Exception ex)
      {
        Console.WriteLine($"[ChatService.DeleteChat] Error deleting chat {chatId}: {ex.Message}");
        Console.WriteLine($"[ChatService.DeleteChat] Stack trace: {ex.StackTrace}");
        throw;
      }
    }
  }
}
