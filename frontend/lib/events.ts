const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

export type AttendanceMode = 'mandatory' | 'signup-required';

export type EventRecord = {
  eventID: number;
  name: string;
  location?: string;
  startDate: string;
  endDate: string;
  description?: string | null;
  capacity?: number | null;
  hasUnlimitedCapacity?: boolean;
  attendanceMode?: string;
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
};

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getEvents() {
  const response = await fetch(`${API_BASE_URL}/api/events`);
  return readJsonOrThrow<EventRecord[]>(response);
}

export async function getEventById(id: string | number) {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}`);
  return readJsonOrThrow<EventRecord>(response);
}

export async function createEvent(payload: EventPayload) {
  const response = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return readJsonOrThrow<EventRecord>(response);
}

export async function updateEvent(id: string | number, payload: EventPayload) {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return readJsonOrThrow<EventRecord>(response);
}

export async function deleteEvent(id: string | number) {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}
