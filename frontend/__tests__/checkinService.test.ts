import { checkinService } from '@/services/checkinService';

function mockTextResponse(body: unknown, ok = true, status = 200) {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);

  return {
    ok,
    status,
    text: jest.fn().mockResolvedValue(text),
  } as unknown as Response;
}

describe('Check-in Service - Unit Tests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('startSession', () => {
    it('should start a session with the expected payload and headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockTextResponse({
          sessionId: 10,
          eventID: 5,
          sessionType: 'qr',
          token: 'qr-token',
          startedAt: '2026-05-06T10:00:00Z',
        })
      );

      const response = await checkinService.startSession(5, 'qr', 20, 'token-1');

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5118/api/checkins/sessions/start/5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-1',
        },
        body: JSON.stringify({ sessionType: 'qr', qrTokenLifetimeMinutes: 20 }),
      });
      expect(response).toEqual({
        sessionId: 10,
        eventID: 5,
        sessionType: 'qr',
        token: 'qr-token',
        startedAt: '2026-05-06T10:00:00Z',
      });
    });
  });

  describe('validateQrToken', () => {
    it('should send the QR token validation request using participantID', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockTextResponse(undefined));

      await expect(checkinService.validateQrToken('qr-abc', 99, 'token-2')).resolves.toBeUndefined();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5118/api/checkins/sessions/qr/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-2',
        },
        body: JSON.stringify({ token: 'qr-abc', participantID: 99 }),
      });
    });
  });

  describe('stopCheckinSession', () => {
    it('should throw server errors when stopping a session fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockTextResponse('Session not found', false, 404));

      await expect(checkinService.stopCheckinSession(8, 'self', 'token-3')).rejects.toThrow(
        '404: Session not found'
      );
    });
  });

  describe('getActiveSessionForEvent', () => {
    it('should fetch the active session state for an event', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockTextResponse({
          isActive: true,
          sessionId: 55,
          token: 'abc',
        })
      );

      await expect(checkinService.getActiveSessionForEvent(8, 'self', 'token-3')).resolves.toEqual({
        isActive: true,
        sessionId: 55,
        token: 'abc',
      });
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5118/api/checkins/sessions/active/8/self', {
        headers: { Authorization: 'Bearer token-3' },
      });
    });
  });
});
