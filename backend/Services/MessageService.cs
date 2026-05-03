using MyApp.API.Data;
using MyApp.API.Models;

namespace MyApp.API.Services
{
    public class MessageDto
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public int SenderParticipantId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
    }

    public class MessageService
    {
        private readonly AppDbContext _context;

        public MessageService(AppDbContext context)
        {
            _context = context;
        }

        public List<MessageDto> GetByEvent(int eventId)
        {
            return _context.Messages
                .Where(m => m.EventId == eventId)
                .OrderBy(m => m.SentAt)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    EventId = m.EventId,
                    SenderParticipantId = m.SenderParticipantId,
                    SenderName = m.SenderName,
                    Body = m.Body,
                    SentAt = m.SentAt,
                })
                .ToList();
        }

        public (MessageDto? Message, string Error) Send(int eventId, int senderParticipantId, string senderName, string body)
        {
            if (string.IsNullOrWhiteSpace(body))
                return (null, "Message body cannot be empty.");

            if (body.Length > 500)
                return (null, "Message body cannot exceed 500 characters.");

            var message = new Message
            {
                EventId = eventId,
                SenderParticipantId = senderParticipantId,
                SenderName = senderName,
                Body = body.Trim(),
                SentAt = DateTime.UtcNow,
            };

            _context.Messages.Add(message);
            _context.SaveChanges();

            return (new MessageDto
            {
                Id = message.Id,
                EventId = message.EventId,
                SenderParticipantId = message.SenderParticipantId,
                SenderName = message.SenderName,
                Body = message.Body,
                SentAt = message.SentAt,
            }, string.Empty);
        }
    }
}
