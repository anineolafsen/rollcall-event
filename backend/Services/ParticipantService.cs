using MyApp.API.Models;
using MyApp.API.Data;

namespace MyApp.API.Services
{
  public class ParticipantService
  {
    private readonly AppDbContext _context;

    public ParticipantService(AppDbContext context)
    {
      _context = context;
    }

    public List<Participant> GetAllParticipants()
    {
      return _context.Participants.ToList();
    }

    public Participant AddParticipant(Participant participant)
    {
      _context.Participants.Add(participant);
      _context.SaveChanges();
      return participant;
    }
  }
}
