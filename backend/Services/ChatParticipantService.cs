using MyApp.API.Data;
using MyApp.API.Models;
using Microsoft.EntityFrameworkCore;

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
        .Where(cp => cp.ChatId == chatId)
        .OrderBy(cp => cp.JoinedAt)
        .ToList();
    }

    public ChatParticipant? GetParticipant(int chatId, int userId)
    {
      return _context.ChatParticipants
        .FirstOrDefault(cp => cp.ChatId == chatId && cp.UserId == userId);
    }

    public ChatParticipant AddParticipant(int chatId, int userId)
    {
      var participant = new ChatParticipant
      {
        ChatId = chatId,
        UserId = userId,
        JoinedAt = DateTime.UtcNow
      };

      _context.ChatParticipants.Add(participant);
      _context.SaveChanges();
      return participant;
    }

    public ChatParticipant? AddParticipantByUserId(int chatId, int userId)
    {
      var user = _context.Users.FirstOrDefault(u => u.Id == userId);
      if (user == null)
      {
        throw new InvalidOperationException("User not found.");
      }

      return AddParticipant(chatId, user.Id);
    }

    public bool RemoveParticipant(int chatId, int userId)
    {
      var participant = _context.ChatParticipants
        .FirstOrDefault(cp => cp.ChatId == chatId && cp.UserId == userId);

      if (participant == null)
      {
        return false;
      }

      _context.ChatParticipants.Remove(participant);
      _context.SaveChanges();
      return true;
    }

    public bool ParticipantExists(int chatId, int userId)
    {
      return _context.ChatParticipants
        .Any(cp => cp.ChatId == chatId && cp.UserId == userId);
    }

    public bool ParticipantExistsByUserId(int chatId, int userId)
    {
      var user = _context.Users.FirstOrDefault(u => u.Id == userId);
      if (user == null)
      {
        return false;
      }

      return ParticipantExists(chatId, user.Id);
    }
  }
}
