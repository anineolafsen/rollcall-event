using MyApp.API.Models;
using MyApp.API.Data;

namespace MyApp.API.Services
{
  public class TripService
  {
    private readonly AppDbContext _context;

    public TripService(AppDbContext context)
    {
      _context = context;
    }

    public List<Trip> GetAllTrips()
    {
      return _context.Trips.ToList();
    }

    // Returns only trips where the user you are authenticated with is a participant
    public List<Trip> GetTripsForUser(string clerkUserId)
    {
      var tripIds = _context.Participants
        .Where(p => p.UserID == clerkUserId)
        .Select(p => p.TripID)
        .ToList();
      return _context.Trips
        .Where(t => tripIds.Contains(t.TripID))
        .ToList();
    }

    public Trip? GetTripById(int id)
    {
      return _context.Trips.FirstOrDefault(t => t.TripID == id);
    }

    public Trip CreateTrip(Trip trip)
    {
      _context.Trips.Add(trip);
      _context.SaveChanges();
      return trip;
    }

    public bool DeleteTrip(int id)
    {
      var trip = _context.Trips.FirstOrDefault(t => t.TripID == id);
      if (trip == null)
      {
        return false;
      }
      _context.Trips.Remove(trip);
      _context.SaveChanges();
      return true;
    }
  }
}