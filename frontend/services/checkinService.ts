const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

export type CheckinSessionType = 'self' | 'qr';

export interface CheckinSessionResponse {
  sessionId: number;
  eventID: number;
  sessionType: CheckinSessionType;
  token?: string | null;
  expiresAt?: string | null;
  startedAt: string;
  participantsToNotify?: string[];
}

export interface EventParticipantStatus {
  participantID: number;
  userID: string;
  name: string;
  email: string;
  phone?: string | null;
  isCheckedIn: boolean;
  checkedInAt?: string | null;
}

export interface ActiveSessionLookup {
  eventIds: number[];
}

function buildHeaders(token?: string | null, includeJson = false): HeadersInit {
  const headers: Record<string, string> = {};

  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(rawText?.trim() ? `${response.status}: ${rawText}` : `HTTP error! status: ${response.status}`);
  }

  return rawText ? (JSON.parse(rawText) as T) : ({} as T);
}

export const checkinService = {
  async startSession(
    eventId: string | number,
    sessionType: CheckinSessionType,
    qrTokenLifetimeMinutes = 15,
    token?: string | null,
  ): Promise<CheckinSessionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/checkins/sessions/start/${eventId}`, {
      method: 'POST',
      headers: buildHeaders(token, true),
      body: JSON.stringify({ sessionType, qrTokenLifetimeMinutes }),
    });

    return readJsonOrThrow<CheckinSessionResponse>(response);
  },

  async getEventParticipants(eventId: string | number, token?: string | null): Promise<EventParticipantStatus[]> {
    const response = await fetch(`${API_BASE_URL}/api/checkins/events/${eventId}/participants`, {
      headers: buildHeaders(token),
    });

    return readJsonOrThrow<EventParticipantStatus[]>(response);
  },

  async participantCheckIn(eventId: string | number, participantId: number, token?: string | null): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/checkins/events/${eventId}/participants/${participantId}`, {
      method: 'POST',
      headers: buildHeaders(token),
    });

    await readJsonOrThrow(response);
  },

  async participantUncheckIn(eventId: string | number, participantId: number, token?: string | null): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/checkins/events/${eventId}/participants/${participantId}`, {
      method: 'DELETE',
      headers: buildHeaders(token),
    });

    await readJsonOrThrow(response);
  },

  async validateQrToken(tokenValue: string, participantId: number, token?: string | null): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/checkins/sessions/qr/validate`, {
      method: 'POST',
      headers: buildHeaders(token, true),
      body: JSON.stringify({ token: tokenValue, participantID: participantId }),
    });

    await readJsonOrThrow(response);
  },

  async getActiveSessionsForUser(userId: string | number, token?: string | null): Promise<ActiveSessionLookup> {
    const response = await fetch(`${API_BASE_URL}/api/checkins/sessions/active-for-user/${userId}`, {
      headers: buildHeaders(token),
    });

    return readJsonOrThrow<ActiveSessionLookup>(response);
  },

  async getActiveSessionForEvent(
    eventId: string | number,
    sessionType: CheckinSessionType,
    token?: string | null,
  ): Promise<{ isActive: boolean; sessionId?: number; token?: string | null; expiresAt?: string | null }> {
    const response = await fetch(`${API_BASE_URL}/api/checkins/sessions/active/${eventId}/${sessionType}`, {
      headers: buildHeaders(token),
    });

    return readJsonOrThrow(response);
  },
};
