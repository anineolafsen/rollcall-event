const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

export type AttendanceMode = 'mandatory' | 'signup-required';

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

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getEvents(tripId?: string | number, token?: string | null) {
  const endpoint = tripId ? `${API_BASE_URL}/api/trips/${tripId}/events` : `${API_BASE_URL}/api/events`;
  
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(endpoint, { headers });
  return readJsonOrThrow<EventRecord[]>(response);
}

export async function getEventById(id: string | number, token?: string | null) {
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, { headers });
  return readJsonOrThrow<EventRecord>(response);
}

export async function createEvent(payload: EventPayload, token?: string | null) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  return readJsonOrThrow<EventRecord>(response);
}

export async function updateEvent(id: string | number, payload: EventPayload, token?: string | null) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });

  return readJsonOrThrow<EventRecord>(response);
}

export async function deleteEvent(id: string | number, token?: string | null) {
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}
