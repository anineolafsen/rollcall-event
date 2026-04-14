using MyApp.API.Models;
using MyApp.API.Data;
using System.Security.Cryptography;

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

    private bool TryParseDate(string dateStr, out DateTime date)
    {
      // Try ISO format (YYYY-MM-DD or ISO 8601)
      if (DateTime.TryParse(dateStr, out date))
      {
        return true;
      }
      
      // Try DD.MM.YYYY format
      if (DateTime.TryParseExact(dateStr, "dd.MM.yyyy", 
        System.Globalization.CultureInfo.InvariantCulture, 
        System.Globalization.DateTimeStyles.None, out date))
      {
        return true;
      }

      return false;
    }

    public Trip CreateTrip(Trip trip)
    {
      // Validate dates
      if (!TryParseDate(trip.StartDate, out var startDate))
      {
        throw new InvalidOperationException($"Invalid start date format: {trip.StartDate}. Use YYYY-MM-DD or DD.MM.YYYY format.");
      }

      if (!TryParseDate(trip.EndDate, out var endDate))
      {
        throw new InvalidOperationException($"Invalid end date format: {trip.EndDate}. Use YYYY-MM-DD or DD.MM.YYYY format.");
      }

      if (endDate <= startDate)
      {
        throw new InvalidOperationException("End date must be after start date.");
      }

      trip.TripID = GenerateUniqueTripId();
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

    private int GenerateUniqueTripId()
    {
      var bytes = new byte[4];

      while (true)
      {
        RandomNumberGenerator.Fill(bytes);
        var id = BitConverter.ToInt32(bytes, 0) & int.MaxValue;

        if (id == 0)
        {
          continue;
        }

        var exists = _context.Trips.Any(t => t.TripID == id);
        if (!exists)
        {
          return id;
        }
      }
    }
  }
}
