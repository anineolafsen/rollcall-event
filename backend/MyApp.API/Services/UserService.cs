using MyApp.API.Models;

namespace MyApp.API.Services
{
  public class UserService
  {
    private static List<User> _users = new List<User>();

    public List<User> GetAllUsers()
    {
      return _users;
    }

    public User CreateUser(User user)
    {
      user.Id = _users.Count + 1;
      _users.Add(user);
      return user;
    }
  }
}