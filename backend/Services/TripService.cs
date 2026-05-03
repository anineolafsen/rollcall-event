using MyApp.API.Models;
using MyApp.API.Data;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;

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

    public List<Trip> GetTripsByUser(int userId)
    {
      return _context.Trips
        .Where(t => t.Participants.Any(p => p.UserId == userId))
        .ToList();
    }

    public List<object> GetTripsWithOrganizerStatusByUser(int userId)
    {
      // Single query: fetch trips with organizer status in one go
      return _context.Trips
        .Where(t => t.Participants.Any(p => p.UserId == userId))
        .Select(t => new {
          t.Id,
          t.Name,
          t.StartDate,
          t.EndDate,
          t.Destination,
          t.Description,
          IsOrganizer = t.Participants
            .Where(p => p.UserId == userId && p.IsOrganizer)
            .Any()
        })
        .Cast<object>()
        .ToList();
    }

    public bool UserHasAccessToTrip(int tripId, int userId)
    {
      // Check if the user is a participant of that specific trip
      return _context.Participants.Any(p => p.TripId == tripId && p.UserId == userId);
    }

    public bool UserIsOrganizer(int tripId, int userId)
    {
      // Check if the user is marked as an organizer in the participants table
      return _context.Participants.Any(p => p.TripId == tripId && p.UserId == userId && p.IsOrganizer);
    }

    public Trip? GetTripById(int id)
    {
      return _context.Trips.FirstOrDefault(t => t.Id == id);
    }

    private bool TryParseDate(string dateStr, out DateTime date)
    {
      if (DateTime.TryParse(dateStr, out date))
      {
        return true;
      }
      
      if (DateTime.TryParseExact(dateStr, "dd.MM.yyyy", 
        System.Globalization.CultureInfo.InvariantCulture, 
        System.Globalization.DateTimeStyles.None, out date))
      {
        return true;
      }

      return false;
    }

    public Trip CreateTrip(Trip trip, int creatorUserId)
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

      using var transaction = _context.Database.BeginTransaction();
      try
      {
        // 1. Save the Trip
        _context.Trips.Add(trip);
        _context.SaveChanges(); // Generates the Trip.Id

        // 2. Automatically add the creator as the first Participant (Organizer)
        var participant = new Participant
        {
          TripId = trip.Id,
          UserId = creatorUserId,
          IsOrganizer = true
        };
        _context.Participants.Add(participant);
        _context.SaveChanges();

        transaction.Commit();
        return trip;
      }
      catch
      {
        transaction.Rollback();
        throw;
      }
    }

    public Trip? UpdateTrip(int id, Trip updatedTrip)
    {
      var trip = _context.Trips.FirstOrDefault(t => t.Id == id);
      if (trip == null)
      {
        return null;
      }

      // Validate dates
      if (!TryParseDate(updatedTrip.StartDate, out var startDate))
      {
        throw new InvalidOperationException($"Invalid start date format: {updatedTrip.StartDate}. Use YYYY-MM-DD or DD.MM.YYYY format.");
      }

      if (!TryParseDate(updatedTrip.EndDate, out var endDate))
      {
        throw new InvalidOperationException($"Invalid end date format: {updatedTrip.EndDate}. Use YYYY-MM-DD or DD.MM.YYYY format.");
      }

      if (endDate <= startDate)
      {
        throw new InvalidOperationException("End date must be after start date.");
      }

      // Update trip properties
      trip.Name = updatedTrip.Name;
      trip.StartDate = updatedTrip.StartDate;
      trip.EndDate = updatedTrip.EndDate;
      trip.Destination = updatedTrip.Destination;
      trip.Description = updatedTrip.Description;

      _context.Trips.Update(trip);
      _context.SaveChanges();
      return trip;
    }

    public bool DeleteTrip(int id)
    {
      var trip = _context.Trips.FirstOrDefault(t => t.Id == id);
      if (trip == null)
      {
        return false;
      }
      _context.Trips.Remove(trip);
      _context.SaveChanges();
      return true;
    }

    public int DeleteExpiredTrips()
    {
      var cutoff = DateTime.UtcNow.AddDays(-7);
      var expired = _context.Trips
        .Where(t => t.EndDate != null && DateTime.Parse(t.EndDate) < cutoff)
        .ToList();

      _context.Trips.RemoveRange(expired);
      _context.SaveChanges();
      return expired.Count;
    }
  }
}
