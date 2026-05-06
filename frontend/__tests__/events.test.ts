import {
  createEvent,
  deleteEvent,
  getEvents,
  leaveEvent,
  type EventPayload,
} from '@/lib/events';

function mockTextResponse(body: unknown, ok = true, status = 200) {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);

  return {
    ok,
    status,
    text: jest.fn().mockResolvedValue(text),
  } as unknown as Response;
}

describe('Events API - Unit Tests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getEvents', () => {
    it('should fetch trip events and normalize legacy response fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockTextResponse([
          {
            eventID: 42,
            name: 'Safety briefing',
            startDate: '2026-05-06T12:00:00Z',
            endDate: '2026-05-06T13:00:00Z',
            tripID: 9,
          },
        ])
      );

      const events = await getEvents(9, 'token-123');

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5118/api/trips/9/events', {
        headers: { Authorization: 'Bearer token-123' },
      });
      expect(events).toEqual([
        {
          id: 42,
          name: 'Safety briefing',
          location: undefined,
          startDate: '2026-05-06T12:00:00Z',
          endDate: '2026-05-06T13:00:00Z',
          description: null,
          capacity: null,
          hasUnlimitedCapacity: undefined,
          attendanceMode: undefined,
          isEmergency: false,
          tripId: 9,
          participantCount: undefined,
          tripParticipantCount: undefined,
          isJoined: undefined,
          joinButtonState: undefined,
          isOrganizer: undefined,
          isSelfCheckinActive: undefined,
        },
      ]);
    });
  });

  describe('createEvent', () => {
    it('should send JSON payload with auth header and return normalized event', async () => {
      const payload: EventPayload = {
        name: 'Camp setup',
        location: 'Main field',
        startDate: '2026-05-06T16:00:00Z',
        endDate: '2026-05-06T18:00:00Z',
        description: 'Prepare the site',
        capacity: 20,
        hasUnlimitedCapacity: false,
        attendanceMode: 'mandatory',
        isEmergency: false,
        tripId: 3,
      };

      (global.fetch as jest.Mock).mockResolvedValue(
        mockTextResponse({
          id: 88,
          ...payload,
        })
      );

      const event = await createEvent(payload, 'secure-token');

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5118/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer secure-token',
        },
        body: JSON.stringify(payload),
      });
      expect(event.id).toBe(88);
      expect(event.tripId).toBe(3);
    });
  });

  describe('leaveEvent', () => {
    it('should encode the optional leave reason in the request URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockTextResponse({
          id: 5,
          name: 'Workshop',
          startDate: '2026-05-06T16:00:00Z',
          endDate: '2026-05-06T18:00:00Z',
          tripId: 1,
        })
      );

      await leaveEvent(5, 'token', 'Need a break & rest');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5118/api/events/5/leave?reason=Need%20a%20break%20%26%20rest',
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer token' },
        }
      );
    });
  });

  describe('deleteEvent', () => {
    it('should throw the server response body for failed deletes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockTextResponse('Forbidden', false, 403));

      await expect(deleteEvent(5, 'token')).rejects.toThrow('403: Forbidden');
    });
  });
});
