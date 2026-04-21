using MyApp.API.Data;
using MyApp.API.Models;

namespace MyApp.API.Services
{
  public class ChatParticipantService
  {
    private readonly AppDbContext _context;

    public ChatParticipantService(AppDbContext context)
    {
      _context = context;
    }

    public List<ChatParticipant> GetParticipantsByChat(int chatId)
    {
      return _context.ChatParticipants
        .Where(cp => cp.ChatID == chatId)
        .OrderBy(cp => cp.JoinedAt)
        .ToList();
    }

    public ChatParticipant? GetParticipant(int chatId, string userEmail)
    {
      return _context.ChatParticipants
        .FirstOrDefault(cp => cp.ChatID == chatId && cp.UserEmail == userEmail);
    }

    public ChatParticipant AddParticipant(int chatId, string userEmail)
    {
      var participant = new ChatParticipant
      {
        ChatID = chatId,
        UserEmail = userEmail,
        JoinedAt = DateTime.UtcNow
      };

      _context.ChatParticipants.Add(participant);
      _context.SaveChanges();
      return participant;
    }

    public bool RemoveParticipant(int chatId, string userEmail)
    {
      var participant = _context.ChatParticipants
        .FirstOrDefault(cp => cp.ChatID == chatId && cp.UserEmail == userEmail);

      if (participant == null)
      {
        return false;
      }

      _context.ChatParticipants.Remove(participant);
      _context.SaveChanges();
      return true;
    }

    public bool ParticipantExists(int chatId, string userEmail)
    {
      return _context.ChatParticipants
        .Any(cp => cp.ChatID == chatId && cp.UserEmail == userEmail);
    }
  }
}
