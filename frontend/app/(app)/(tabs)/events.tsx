import { Redirect } from 'expo-router';

import { useMobileTripStore } from '@/lib/mobile-trip-store';
import { UpcomingEventsScreen } from '@/components/upcoming-events';

export default function EventsScreen() {
  const selectedTripId = useMobileTripStore((state) => state.selectedTripId);

  if (!selectedTripId) {
    return <Redirect href="/trips" />;
  }

  return <UpcomingEventsScreen tripId={selectedTripId} />;
}
