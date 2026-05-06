import {
  getParticipantNeeds,
  getTripParticipants,
  promoteParticipantToOrganizer,
} from '@/lib/participants';

function mockJsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('Participants API - Unit Tests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getParticipantNeeds', () => {
    it('should fetch participant needs with authorization', async () => {
      const payload = [
        {
          userId: 1,
          name: 'Alex',
          email: 'alex@example.com',
          allergies: 'Nuts',
          otherInfo: null,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue(mockJsonResponse(payload));

      await expect(getParticipantNeeds(7, 'token-1')).resolves.toEqual(payload);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5118/api/trips/7/participants/needs', {
        headers: { Authorization: 'Bearer token-1' },
      });
    });
  });

  describe('getTripParticipants', () => {
    it('should return the primary endpoint response when available', async () => {
      const payload = [
        {
          userId: 2,
          name: 'Sam',
          email: 'sam@example.com',
          isOrganizer: true,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue(mockJsonResponse(payload));

      await expect(getTripParticipants(11, 'token-2')).resolves.toEqual(payload);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should fall back to the legacy endpoint and default isOrganizer to false', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockJsonResponse({ error: 'missing' }, false, 404))
        .mockResolvedValueOnce(
          mockJsonResponse([
            {
              userId: 3,
              name: 'Jamie',
              email: 'jamie@example.com',
            },
          ])
        );

      await expect(getTripParticipants(12, 'token-3')).resolves.toEqual([
        {
          userId: 3,
          name: 'Jamie',
          email: 'jamie@example.com',
          isOrganizer: false,
        },
      ]);
      expect(global.fetch).toHaveBeenNthCalledWith(2, 'http://localhost:5118/api/participants/trip/12', {
        headers: { Authorization: 'Bearer token-3' },
      });
    });
  });

  describe('promoteParticipantToOrganizer', () => {
    it('should send the organizer promotion payload', async () => {
      const payload = {
        userId: 4,
        name: 'Taylor',
        email: 'taylor@example.com',
        isOrganizer: true,
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockJsonResponse(payload));

      await expect(promoteParticipantToOrganizer(13, 4, 'token-4')).resolves.toEqual(payload);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5118/api/trips/13/organizers', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token-4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 4 }),
      });
    });

    it('should surface API error payloads for failed organizer promotions', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonResponse({ error: 'User is already an organizer' }, false, 400)
      );

      await expect(promoteParticipantToOrganizer(13, 4, 'token-4')).rejects.toThrow(
        'User is already an organizer'
      );
    });
  });
});
