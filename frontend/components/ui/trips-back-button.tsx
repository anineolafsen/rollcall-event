import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMobileTripStore } from '@/lib/mobile-trip-store';

export function TripsBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const setSelectedTrip = useMobileTripStore((state) => state.setSelectedTrip);
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  const isEventsRoute = pathname === '/events';
  const isEventDetailsRoute = Boolean(pathname?.match(/^\/events\/[^/]+$/));
  const isCheckInRoute = pathname === '/checkIn';
  const isProfileRoute = pathname === '/profile';

  if (!pathname || pathname === '/trips' || isEventsRoute || isDesktopWeb || isCheckInRoute || isProfileRoute) {
    return null;
  }

  const handleBack = () => {
    if (isEventDetailsRoute) {
      if (tripId) {
        setSelectedTrip({ id: Number(tripId) });
      }
      router.replace('/events');
      return;
    }

    router.replace('/trips');
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to trips"
      onPress={handleBack}
      style={[
        styles.button,
        {
          top: insets.top + 12,
        },
      ]}
    >
      <MaterialIcons name="arrow-back" size={22} color="#1a3d5c" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#d9e8f5',
    shadowColor: '#0b2540',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a3d5c',
  },
});
