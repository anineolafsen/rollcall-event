using Microsoft.EntityFrameworkCore;
using MyApp.API.Models;

namespace MyApp.API.Data
{
  public class AppDbContext : DbContext
  {
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Trip> Trips { get; set; } = null!;

    public DbSet<Participant> Participants { get; set; } = null!;

    public DbSet<Invitation> Invitations { get; set; } = null!;

    public DbSet<Event> Events { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      base.OnModelCreating(modelBuilder);

      modelBuilder.Entity<Event>()
        .HasOne(eventItem => eventItem.Trip)
        .WithMany(trip => trip.Events)
        .HasForeignKey(eventItem => eventItem.TripID)
        .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<Event>()
        .Property(eventItem => eventItem.EventID)
        .ValueGeneratedNever();
    }
  }
}
