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
      _context.Chats.Add(chat);
      _context.SaveChanges();
      return chat;
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
      var chat = _context.Chats.FirstOrDefault(c => c.Id == chatId);
      if (chat == null)
      {
        return false;
      }

      _context.Chats.Remove(chat);
      _context.SaveChanges();
      return true;
    }
  }
}
