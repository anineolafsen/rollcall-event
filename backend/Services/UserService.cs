using Microsoft.EntityFrameworkCore;
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

    // Updates Name and Phone for a user. Used by the profile page.
    public User? UpdateUser(int id, string? name, string? phone)
    {
      var user = _context.Users.FirstOrDefault(u => u.Id == id);
      if (user == null) return null;
      user.Name = name;
      user.Phone = phone;
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

    // Returns all UserNeeds for a user, one entry per trip with trip name.
    // Used by the profile page to display health info grouped by trip.
    public List<UserNeedsResponse> GetAllUserNeeds(int userId)
    {
      return _context.UserNeeds
        .Where(n => n.UserId == userId)
        .Include(n => n.Trip)
        .Select(n => new UserNeedsResponse
        {
          TripId = n.TripId,
          TripName = n.Trip!.Name,
          Allergies = n.Allergies,
          OtherInfo = n.OtherInfo
        })
        .ToList();
    }

    // Returns UserNeeds for a specific (userId, tripId). Used by the popup to pre-load existing data.
    public UserNeeds? GetUserNeedsForTrip(int userId, int tripId)
    {
      return _context.UserNeeds.FirstOrDefault(n => n.UserId == userId && n.TripId == tripId);
    }

    // Creates or updates UserNeeds for a specific (userId, tripId). Used from the popup.
    public UserNeeds UpsertUserNeedsForTrip(int userId, int tripId, UserNeeds dto)
    {
      var row = _context.UserNeeds.FirstOrDefault(n => n.UserId == userId && n.TripId == tripId);
      if (row == null)
      {
        row = new UserNeeds { UserId = userId, TripId = tripId };
        _context.UserNeeds.Add(row);
      }
      row.Allergies = dto.Allergies;
      row.OtherInfo = dto.OtherInfo;
      _context.SaveChanges();
      return row;
    }
  }
}
