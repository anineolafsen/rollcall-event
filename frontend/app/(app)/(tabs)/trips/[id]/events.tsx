import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';

import { NotifyButton } from '@/components/NotifyButton';
import { UpcomingEventsScreen } from '@/components/upcoming-events';
import { TripActionButton } from '@/components/ui/trip-action-button';
import { AppButton } from '@/components/ui/button';
import { Siren } from 'lucide-react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

interface Trip {
  id: number;
  name: string;
  isOrganizer: boolean;
}

export default function TripEventsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const token = await getToken({ template: 'RollCallAuth' });
        const response = await fetch(`${API_BASE_URL}/api/trips/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data: Trip = await response.json();
        setTrip(data);
      } catch {
        setError('Could not load trip details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void fetchTrip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#76b6ee" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Trip not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <UpcomingEventsScreen
      tripId={trip.id}
      title="Upcoming Events"
      tripName={trip.name}
      showBackButton
      isOrganizer={trip.isOrganizer}
      actionsBelowHeader={
        trip.isOrganizer ? (
          <View style={styles.buttonRow}>
            <NotifyButton tripId={trip.id} tripName={trip.name} />
            <TripActionButton
              label="+ Emergency event"
              backgroundColor="#ffeaea"
              textColor="#c92a2a"
              borderColor="#c92a2a"
              borderWidth={1}
              rightIcon={<Siren size={18} color="#c92a2a" style={{ marginLeft: 8 }} />}
              onPress={() => router.push(`/events/create?tripId=${trip.id}&emergency=true`)}
            />
          </View>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#b0413e',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
