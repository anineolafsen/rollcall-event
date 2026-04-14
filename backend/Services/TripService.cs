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
