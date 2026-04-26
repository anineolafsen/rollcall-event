const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

export type AttendanceMode = 'mandatory' | 'signup-required';
export type JoinButtonState = 'join' | 'leave' | 'mandatory';

export type EventRecord = {
  id: number;
  name: string;
  location?: string;
  startDate: string;
  endDate: string;
  description?: string | null;
  capacity?: number | null;
  hasUnlimitedCapacity?: boolean;
  attendanceMode?: string;
  tripId: number;
  participantCount?: number;
  tripParticipantCount?: number;
  isJoined?: boolean;
  joinButtonState?: JoinButtonState;
  isOrganizer?: boolean;
};

export type EventPayload = {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  capacity: number | null;
  hasUnlimitedCapacity: boolean;
  attendanceMode: AttendanceMode;
  tripId: number;
};

function buildHeaders(token?: string | null, includeJsonContentType = false): HeadersInit {
  const headers: Record<string, string> = {};

  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function normalizeEvent(raw: any): EventRecord {
  return {
    id: raw.id ?? raw.eventID,
    name: raw.name,
    location: raw.location,
    startDate: raw.startDate,
    endDate: raw.endDate,
    description: raw.description ?? null,
    capacity: raw.capacity ?? null,
    hasUnlimitedCapacity: raw.hasUnlimitedCapacity,
    attendanceMode: raw.attendanceMode,
    tripId: raw.tripId ?? raw.tripID,
    participantCount: raw.participantCount,
    tripParticipantCount: raw.tripParticipantCount,
    isJoined: raw.isJoined,
    joinButtonState: raw.joinButtonState,
    isOrganizer: raw.isOrganizer,
  };
}

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(rawText?.trim() ? `${response.status}: ${rawText}` : `HTTP error! status: ${response.status}`);
  }

  if (!rawText) {
    return {} as T;
  }

  return JSON.parse(rawText) as T;
}

export async function getEvents(tripId?: string | number, token?: string | null) {
  const endpoint = tripId ? `${API_BASE_URL}/api/trips/${tripId}/events` : `${API_BASE_URL}/api/events`;

  const response = await fetch(endpoint, {
    headers: buildHeaders(token),
  });

  const data = await readJsonOrThrow<any[]>(response);
  return data.map(normalizeEvent);
}

export async function getEventById(id: string | number, token?: string | null) {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    headers: buildHeaders(token),
  });

  const data = await readJsonOrThrow<any>(response);
  return normalizeEvent(data);
}

export async function joinEvent(id: string | number, token?: string | null) {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}/join`, {
    method: 'POST',
    headers: buildHeaders(token),
  });

  const data = await readJsonOrThrow<any>(response);
  return normalizeEvent(data);
}

export async function leaveEvent(id: string | number, token?: string | null, reason?: string) {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  const response = await fetch(`${API_BASE_URL}/api/events/${id}/leave${query}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  });

  const data = await readJsonOrThrow<any>(response);
  return normalizeEvent(data);
}

export async function createEvent(payload: EventPayload, token?: string | null) {
  const response = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'POST',
    headers: buildHeaders(token, true),
    body: JSON.stringify(payload),
  });

  const data = await readJsonOrThrow<any>(response);
  return normalizeEvent(data);
}

export async function updateEvent(id: string | number, payload: EventPayload, token?: string | null) {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: 'PUT',
    headers: buildHeaders(token, true),
    body: JSON.stringify(payload),
  });

  const data = await readJsonOrThrow<any>(response);
  return normalizeEvent(data);
}

export async function deleteEvent(id: string | number, token?: string | null) {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    const rawText = await response.text();
    throw new Error(rawText?.trim() ? `${response.status}: ${rawText}` : `HTTP error! status: ${response.status}`);
  }
}
