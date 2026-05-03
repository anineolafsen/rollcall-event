const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

export interface Message {
  id: number;
  eventId: number;
  senderParticipantId: number;
  senderName: string;
  body: string;
  sentAt: string;
}

function buildHeaders(token?: string | null, includeJson = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (includeJson) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(rawText?.trim() ? `${response.status}: ${rawText}` : `HTTP error! status: ${response.status}`);
  }
  return rawText ? (JSON.parse(rawText) as T) : ({} as T);
}

export const messageService = {
  async getByEvent(eventId: string | number, token?: string | null): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}/api/messages/event/${eventId}`, {
      headers: buildHeaders(token),
    });
    return readJsonOrThrow<Message[]>(response);
  },

  async send(
    eventId: string | number,
    senderParticipantId: number,
    senderName: string,
    body: string,
    token?: string | null,
  ): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/api/messages/event/${eventId}`, {
      method: 'POST',
      headers: buildHeaders(token, true),
      body: JSON.stringify({ senderParticipantId, senderName, body }),
    });
    return readJsonOrThrow<Message>(response);
  },
};
