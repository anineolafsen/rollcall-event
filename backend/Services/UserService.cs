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

    // Find user by ClerkId (the external auth provider ID)
    public User? GetByClerkId(string clerkId)
    {
      return _context.Users.FirstOrDefault(u => u.ClerkId == clerkId);
    }

    public User GetOrCreateUser(string clerkId, string email)
    {
      var user = GetByClerkId(clerkId);

      if (user == null)
      {
        user = new User
        {
          ClerkId = clerkId,
          Email = email
        };
        _context.Users.Add(user);
        _context.SaveChanges();
      }
      else if (user.Email != email)
      {
        // Keep the email in sync if the user changed it in Clerk
        user.Email = email;
        _context.SaveChanges();
      }

      return user;
    }

    // Find user by Email (used for invitations)
    public User? GetByEmail(string email)
    {
      return _context.Users.FirstOrDefault(u => u.Email == email);
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

    public void DeleteUser(int id)
    {
      var user = _context.Users.FirstOrDefault(u => u.Id == id);
      if (user != null)
      {
        _context.Users.Remove(user);
        _context.SaveChanges();
      }
    }
  }
}