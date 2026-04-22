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