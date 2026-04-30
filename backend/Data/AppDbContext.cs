using Microsoft.EntityFrameworkCore;
using MyApp.API.Models;

namespace MyApp.API.Data
{
  public class AppDbContext : DbContext
  {
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
      base.OnConfiguring(optionsBuilder);
      optionsBuilder.ConfigureWarnings(w =>
        w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Trip> Trips { get; set; }
    public DbSet<Participant> Participants { get; set; }
    public DbSet<Invitation> Invitations { get; set; }
    public DbSet<Event> Events { get; set; }
    public DbSet<EventParticipant> EventParticipants { get; set; }
    public DbSet<Checkin> Checkins { get; set; }
    public DbSet<EventCheckinSession> EventCheckinSessions { get; set; }
    public DbSet<Chat> Chats { get; set; }
    public DbSet<ChatParticipant> ChatParticipants { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<Message> Messages { get; set; }

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

      modelBuilder.Entity<EventParticipant>()
        .HasIndex(ep => ep.UserID);

      modelBuilder.Entity<Participant>()
        .HasIndex(p => p.UserId);

      modelBuilder.Entity<Checkin>()
        .HasIndex(c => new { c.EventID, c.ParticipantID });

      modelBuilder.Entity<Checkin>()
        .HasIndex(c => c.EventID);

      modelBuilder.Entity<EventCheckinSession>()
        .Property(session => session.SessionType)
        .HasConversion<string>();

      modelBuilder.Entity<EventCheckinSession>()
        .Property(session => session.Token)
        .HasMaxLength(128);

      modelBuilder.Entity<EventCheckinSession>()
        .HasIndex(session => new { session.EventID, session.SessionType, session.IsActive });

      // Chat relationships
      modelBuilder.Entity<Chat>()
        .HasOne(c => c.Creator)
        .WithMany()
        .HasForeignKey(c => c.CreatorId)
        .OnDelete(DeleteBehavior.Restrict);

      modelBuilder.Entity<Chat>()
        .HasOne<Trip>()
        .WithMany(t => t.Chats)
        .HasForeignKey(c => c.TripId)
        .OnDelete(DeleteBehavior.Cascade);

      // ChatMessage relationships
      modelBuilder.Entity<ChatMessage>()
        .HasOne(cm => cm.Chat)
        .WithMany()
        .HasForeignKey(cm => cm.ChatId)
        .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<ChatMessage>()
        .HasOne(cm => cm.Sender)
        .WithMany()
        .HasForeignKey(cm => cm.SenderId)
        .OnDelete(DeleteBehavior.Restrict);

      // ChatParticipant relationships (HasKey is on the model via [PrimaryKey] attribute)
      modelBuilder.Entity<ChatParticipant>()
        .HasOne(cp => cp.Chat)
        .WithMany()
        .HasForeignKey(cp => cp.ChatId)
        .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<ChatParticipant>()
        .HasOne(cp => cp.User)
        .WithMany()
        .HasForeignKey(cp => cp.UserId)
        .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<Message>()
        .HasOne<Event>()
        .WithMany()
        .HasForeignKey(m => m.EventId)
        .OnDelete(DeleteBehavior.Cascade);

      modelBuilder.Entity<Message>()
        .HasIndex(m => m.EventId);
    }
  }
}