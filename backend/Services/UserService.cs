using MyApp.API.Models;
using MyApp.API.Data;

namespace MyApp.API.Services
{
  public class UserService
  {
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
      _context = context;
    }

    public List<User> GetAllUsers()
    {
      return _context.Users.ToList();
    }

    public User CreateUser(User user)
    {
      _context.Users.Add(user);
      _context.SaveChanges();
      return user;
    }

     // Henter allergier og otherInfo for innlogget bruker
    public User? GetUserNeeds(string clerkUserId)
    {
      return _context.Users.FirstOrDefault(u => u.ClerkUserId == clerkUserId);
    }

    // Oppdaterer allergier og otherInfo for innlogget bruker
    public User? UpdateUserNeeds(string clerkUserId, UpdateUserNeeds dto)
    {
      var user = _context.Users.FirstOrDefault(u => u.ClerkUserId == clerkUserId);
      if (user == null) return null;

      user.Allergies = dto.Allergies;
      user.OtherInfo = dto.OtherInfo;
      _context.SaveChanges();
      return user;
    }
  }
}