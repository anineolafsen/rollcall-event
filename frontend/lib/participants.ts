const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

export type ParticipantNeedsDto = {
  userId: number;
  name: string;
  email: string;
  allergies: string | null;
  otherInfo: string | null;
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
