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
      // Så vi ikke får duplikater av brukere
      var existing = _context.Users.FirstOrDefault(u => u.ClerkUserId == user.ClerkUserId);
      if (existing != null)
      {
        return existing;
      }
      _context.Users.Add(user);
      _context.SaveChanges();
      return user;
    }
  }
}