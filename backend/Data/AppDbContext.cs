using Microsoft.EntityFrameworkCore;
using MyApp.API.Models;

namespace MyApp.API.Data
{
  public class AppDbContext : DbContext
  {
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Trip> Trips { get; set; }
    public DbSet<Participant> Participants { get; set; }
    public DbSet<Invitation> Invitations { get; set; }
    public DbSet<Event> Events { get; set; }
    public DbSet<EventParticipant> EventParticipants { get; set; }
    public DbSet<Checkin> Checkins { get; set; }
    public DbSet<EventCheckinSession> EventCheckinSessions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      base.OnModelCreating(modelBuilder);

      modelBuilder.Entity<Invitation>()
        .HasIndex(i => new { i.TripId, i.Email })
        .IsUnique();

      modelBuilder.Entity<Invitation>()
        .HasOne<Trip>()
        .WithMany()
        .HasForeignKey(i => i.TripId)
        .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<Participant>()
        .HasIndex(p => new { p.TripId, p.UserId })
        .IsUnique();

      modelBuilder.Entity<Participant>()
        .HasOne(p => p.Trip)
        .WithMany(t => t.Participants)
        .HasForeignKey(p => p.TripId)
        .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<Participant>()
        .HasOne(p => p.User)
        .WithMany()
        .HasForeignKey(p => p.UserId)
        .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<Event>()
        .HasOne(e => e.Trip)
        .WithMany(t => t.Events)
        .HasForeignKey(e => e.TripId)
        .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<Event>()
        .Property(e => e.Id)
        .ValueGeneratedNever();

      modelBuilder.Entity<EventParticipant>()
        .HasOne(ep => ep.Event)
        .WithMany(e => e.Participants)
        .HasForeignKey(ep => ep.EventID)
        .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<EventParticipant>()
        .HasIndex(ep => new { ep.EventID, ep.UserID })
        .IsUnique();

      modelBuilder.Entity<EventCheckinSession>()
        .Property(session => session.SessionType)
        .HasConversion<string>();

      modelBuilder.Entity<EventCheckinSession>()
        .Property(session => session.Token)
        .HasMaxLength(128);

      modelBuilder.Entity<EventCheckinSession>()
        .HasIndex(session => new { session.EventID, session.SessionType, session.IsActive });
    }
  }
}