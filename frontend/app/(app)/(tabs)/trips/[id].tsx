import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/expo';

import { NotifyButton } from '@/components/NotifyButton';
import { TripActionButton } from '@/components/ui/trip-action-button';
import { UpcomingEventsScreen } from '@/components/upcoming-events';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

interface Trip {
  id: number;
  name: string;
  isOrganizer: boolean;
}

export default function TripDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

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
  }, [id]); // getToken is stable

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
        <View style={styles.screen}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/trips')}>
            <Text style={styles.backButtonText}>← Go back</Text>
          </TouchableOpacity>
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error || 'Trip not found'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Go back</Text>
        </TouchableOpacity>
      </View>

      <UpcomingEventsScreen
        tripId={trip.id}
        title={trip.name}
        showBackButton={false}
        isOrganizer={trip.isOrganizer}
        actionsBelowHeader={
          trip.isOrganizer ? (
            <View style={styles.buttonRow}>
              <TripActionButton
                label="+ Manage Invitations"
                onPress={() =>
                  router.push({
                    pathname: '/trips/[id]/manage-invitations',
                    params: { id: String(trip.id), tripId: trip.id, tripName: trip.name },
                  })
                }
              />
              <TripActionButton
                label="View Needs"
                backgroundColor="#d9e8f5"
                textColor="#1a3d5c"
                onPress={() =>
                  router.push({
                    pathname: '/trips/[id]/participant-needs',
                    params: { id: String(trip.id), tripName: trip.name },
                  })
                }
              />
              <TripActionButton
                label="✎ Edit"
                backgroundColor="#76b6ee"
                onPress={() =>
                  router.push({
                    pathname: '/trips/create',
                    params: { id: trip.id },
                  })
                }
              />
              <NotifyButton tripId={trip.id} tripName={trip.name} />
              <TripActionButton
                label="+ Create event"
                backgroundColor="#ffffff"
                textColor="#1a3d5c"
                onPress={() => router.push(`/events/create?tripId=${trip.id}`)}
              />
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },
  header: {
    backgroundColor: '#eef5fb',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 15,
    color: '#4a7ca8',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
});
