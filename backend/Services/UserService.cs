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

    public User GetOrCreateUser(string clerkId, string email, string? firstName = null, string? lastName = null, string? phone = null)
    {
      var user = GetByClerkId(clerkId);

      if (user == null)
      {
        // Reuse existing email record when available to avoid duplicate users that can break relations.
        user = GetByEmail(email);

        if (user != null)
        {
          user.ClerkId = clerkId;
          // Set names/phone if they were provided during sync
          if (!string.IsNullOrEmpty(firstName)) user.FirstName = firstName;
          if (!string.IsNullOrEmpty(lastName)) user.LastName = lastName;
          if (!string.IsNullOrEmpty(phone)) user.Phone = phone;
          
          _context.SaveChanges();
        }
        else
        {
          user = new User
          {
            ClerkId = clerkId,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Phone = phone
          };
          _context.Users.Add(user);
          _context.SaveChanges();
        }
      }
      else
      {
        bool changed = false;
        if (user.Email != email) { user.Email = email; changed = true; }
        
        // Only update these if they are provided and currently empty
        if (!string.IsNullOrEmpty(firstName) && string.IsNullOrEmpty(user.FirstName)) { user.FirstName = firstName; changed = true; }
        if (!string.IsNullOrEmpty(lastName) && string.IsNullOrEmpty(user.LastName)) { user.LastName = lastName; changed = true; }
        if (!string.IsNullOrEmpty(phone) && string.IsNullOrEmpty(user.Phone)) { user.Phone = phone; changed = true; }

        if (changed) _context.SaveChanges();
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

    public User? UpdateUser(int id, string? firstName, string? lastName, string? phone)
    {
      var user = _context.Users.FirstOrDefault(u => u.Id == id);
      if (user == null) return null;
      
      if (firstName != null) user.FirstName = firstName;
      if (lastName != null) user.LastName = lastName;
      if (phone != null) user.Phone = phone;
      
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