import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';

import { UpcomingEventsScreen } from '@/components/upcoming-events';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

interface Trip {
  tripID: number;
  name: string;
}

export default function TripDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trips/${id}`);
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data: Trip = await response.json();
        setTrip(data);
      } catch {
        setError('Could not load trip.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTrip();
    }
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
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Go back</Text>
          </TouchableOpacity>
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error || 'Trip not found'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return <UpcomingEventsScreen tripId={trip.tripID} title={trip.name} showBackButton />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#edf4fa',
  },
  content: {
    flex: 1,
    backgroundColor: '#edf4fa',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 28,
  },
  backButton: {
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 15,
    color: '#4a7ca8',
    fontWeight: '600',
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
