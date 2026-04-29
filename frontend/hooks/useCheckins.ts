import type { Participant } from "@/types/participantType";
import { useCallback, useEffect, useState } from "react";
import { checkinService } from "@/services/checkinService";
import { getEventById } from "@/lib/events";

const EMPTY_EVENT = {
  id: '',
  title: 'Check-in',
  checkinOpen: true,
};

export function useCheckins(eventId: string, token?: string | null, tripId?: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [event, setEvent] = useState(EMPTY_EVENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    if (!eventId || !token) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [eventDetails, data] = await Promise.all([
        getEventById(eventId, token),
        checkinService.getEventParticipants(eventId, token),
      ]);
      const mapped: Participant[] = data.map((participant) => ({
        id: participant.participantID,
        userId: participant.userID,
        name: participant.name,
        email: participant.email,
        checkedIn: participant.isCheckedIn,
        checkedInAt: participant.checkedInAt ?? null,
        phone: participant.phone ?? null,
      }));

      setParticipants(mapped);
      setEvent({
        id: String(eventId),
        title: eventDetails.name,
        checkinOpen: true,
      });
      setError(null);
    } catch {
      setError('Could not load check-in participants.');
    } finally {
      setLoading(false);
    }
  }, [eventId, token]);

  useEffect(() => {
    void fetchParticipants();
  }, [fetchParticipants, tripId]);

  useEffect(() => {
    if (!eventId || !token) {
      return;
    }

    const intervalId = setInterval(() => {
      void fetchParticipants();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [eventId, fetchParticipants, token]);

  const checkedIn = participants.filter(p => p.checkedIn === true);
  const notCheckedIn = participants.filter(p => p.checkedIn !== true);

  return { participants, checkedIn, notCheckedIn, loading, setParticipants, event, error, refetch: fetchParticipants };
}