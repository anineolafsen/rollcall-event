const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

export type ParticipantNeedsDto = {
  userId: number;
  name: string;
  email: string;
  allergies: string | null;
  otherInfo: string | null;
};

export type TripParticipantDto = {
  userId: number;
  name: string;
  email: string;
  isOrganizer: boolean;
};

type LegacyTripParticipantDto = {
  userId: number;
  name: string;
  email: string;
};

export async function getParticipantNeeds(
  tripId: number,
  token: string | null
): Promise<ParticipantNeedsDto[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/trips/${tripId}/participants/needs`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function getTripParticipants(
  tripId: number,
  token: string | null
): Promise<TripParticipantDto[]> {
  const headers = { Authorization: `Bearer ${token}` };
  const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/participants`, { headers });

  if (response.ok) {
    return response.json();
  }

  const fallbackResponse = await fetch(`${API_BASE_URL}/api/participants/trip/${tripId}`, { headers });
  if (!fallbackResponse.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const fallbackData: LegacyTripParticipantDto[] = await fallbackResponse.json();
  return fallbackData.map((participant) => ({
    userId: participant.userId,
    name: participant.name,
    email: participant.email,
    isOrganizer: false,
  }));
}

export async function promoteParticipantToOrganizer(
  tripId: number,
  userId: number,
  token: string | null
): Promise<TripParticipantDto> {
  const response = await fetch(
    `${API_BASE_URL}/api/trips/${tripId}/organizers`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    }
  );

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const payload = await response.json();
      if (payload?.error) {
        errorMessage = String(payload.error);
      }
    } catch {
      // Ignore JSON parse failures and keep the HTTP-based message.
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
