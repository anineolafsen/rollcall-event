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
    public DbSet<Chat> Chats { get; set; } = null!;
    public DbSet<ChatParticipant> ChatParticipants { get; set; } = null!;
    public DbSet<ChatMessage> ChatMessages { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      base.OnModelCreating(modelBuilder);

      modelBuilder.Entity<Invitation>()
        .HasIndex(i => new { i.TripId, i.Email })
        .IsUnique();

      modelBuilder.Entity<Participant>()
        .HasIndex(p => new { p.TripId, p.UserId })
        .IsUnique();

      // Configure many-to-one between Participant and Trip
      modelBuilder.Entity<Participant>()
        .HasOne(p => p.Trip)
        .WithMany(t => t.Participants)
        .HasForeignKey(p => p.TripId)
        .OnDelete(DeleteBehavior.Cascade);

      // Configure many-to-one between Participant and User
      modelBuilder.Entity<Participant>()
        .HasOne(p => p.User)
        .WithMany()
        .HasForeignKey(p => p.UserId)
        .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<ChatParticipant>()
        .HasKey(cp => new { cp.ChatId, cp.UserEmail });

      modelBuilder.Entity<Event>()
        .HasOne(eventItem => eventItem.Trip)
        .WithMany(trip => trip.Events)
        .HasForeignKey(eventItem => eventItem.TripId)
        .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<Event>()
        .Property(eventItem => eventItem.Id)
        .ValueGeneratedNever();
    }
  }
}
