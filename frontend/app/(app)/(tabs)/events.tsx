import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Siren } from 'lucide-react-native';

import { NotifyButton } from '@/components/NotifyButton';
import { TripActionButton } from '@/components/ui/trip-action-button';
import { UpcomingEventsScreen } from '@/components/upcoming-events';
import { useMobileTripStore } from '@/lib/mobile-trip-store';

export default function EventsScreen() {
  const router = useRouter();
  const selectedTripId = useMobileTripStore((state) => state.selectedTripId);
  const selectedTripName = useMobileTripStore((state) => state.selectedTripName);
  const selectedTripIsOrganizer = useMobileTripStore((state) => state.selectedTripIsOrganizer);

  if (!selectedTripId) {
    return <Redirect href="/trips" />;
  }

  const organizerActions = selectedTripIsOrganizer ? (
    <View style={styles.buttonRow}>
      <NotifyButton tripId={selectedTripId} tripName={selectedTripName ?? ''} />
      <TripActionButton
        label="+ Emergency event"
        backgroundColor="#ffeaea"
        textColor="#c92a2a"
        borderColor="#c92a2a"
        borderWidth={1}
        rightIcon={<Siren size={18} color="#c92a2a" style={{ marginLeft: 8 }} />}
        onPress={() => router.push(`/events/create?tripId=${selectedTripId}&emergency=true`)}
      />
    </View>
  ) : undefined;

  return (
    <UpcomingEventsScreen
      tripId={selectedTripId}
      isOrganizer={selectedTripIsOrganizer}
      showBackButton={false}
      actionsBelowHeader={organizerActions}
    />
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
