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

    public Trip CreateTrip(Trip trip)
    {
      _context.Trips.Add(trip);
      _context.SaveChanges();
      return trip;
    }
  }
}