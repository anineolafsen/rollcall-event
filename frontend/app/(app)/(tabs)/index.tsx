import { useAuth } from '@clerk/expo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMobileTripStore } from '@/lib/mobile-trip-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type Trip = {
  id: number;
  name: string;
  isOrganizer?: boolean;
  destination?: string;
  description?: string;
};

export default function Home() {
  const router = useRouter();
  const { getToken } = useAuth();
  const selectedTripId = useMobileTripStore((state) => state.selectedTripId);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken({ template: 'RollCallAuth' });
      const response = await fetch(`${API_BASE_URL}/api/trips/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data: Trip[] = await response.json();
      setTrips(data);
    } catch {
      setError('Could not load trip information.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    void fetchTrips();
  }, [fetchTrips]);

  const activeTrip = useMemo(() => {
    if (trips.length === 0) {
      return null;
    }

    return trips.find((trip) => trip.id === selectedTripId) ?? trips[0];
  }, [selectedTripId, trips]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void fetchTrips();
            }}
            tintColor="#76b6ee"
          />
        }
      >
        <View style={styles.mainContent}>
          <Text style={styles.title}>
            {activeTrip ? activeTrip.name : 'Trip description'}
          </Text>

          {loading && !refreshing ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#76b6ee" />
            </View>
          ) : error ? (
            <Text style={styles.feedbackText}>{error}</Text>
          ) : !activeTrip ? (
            <Text style={styles.feedbackText}>No trips found yet.</Text>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.description}>
                  {activeTrip.description?.trim() || 'No trip description added yet.'}
                </Text>
              </View>
              {activeTrip.isOrganizer ? (
                <View style={styles.buttonRow}>
                  <Pressable
                    style={styles.inviteButton}
                    onPress={() =>
                      router.push({
                        pathname: '/trips/[id]/manage-invitations',
                        params: {
                          id: String(activeTrip.id),
                          tripId: activeTrip.id,
                          tripName: activeTrip.name,
                        },
                      })
                    }
                  >
                    <Text style={styles.inviteButtonText}>+ Manage Invitations</Text>
                  </Pressable>
                  <Pressable
                    style={styles.needsButton}
                    onPress={() =>
                      router.push({
                        pathname: '/trips/[id]/participant-needs',
                        params: { id: String(activeTrip.id), tripName: activeTrip.name },
                      })
                    }
                  >
                    <Text style={styles.needsButtonText}>View Needs</Text>
                  </Pressable>
                  <Pressable
                    style={styles.editButton}
                    onPress={() =>
                      router.push({
                        pathname: '/trips/create',
                        params: { id: activeTrip.id },
                      })
                    }
                  >
                    <Text style={styles.editButtonText}>✎ Edit</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
      <Pressable style={styles.switchButton} onPress={() => router.push('/trips')}>
        <MaterialIcons name="swap-horiz" size={20} color="#ffffff" />
        <Text style={styles.switchButtonText}>Switch trip</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 128,
  },
  mainContent: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: '#090909',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 24,
  },
  inviteButton: {
    backgroundColor: '#4a7ca8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  inviteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  needsButton: {
    backgroundColor: '#d9e8f5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  needsButtonText: {
    color: '#1a3d5c',
    fontWeight: '600',
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#76b6ee',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  switchButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 88,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4a7ca8',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  switchButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#d9e8f5',
  },
  description: {
    fontSize: 17,
    lineHeight: 28,
    color: '#1a3d5c',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  feedbackText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#5d7288',
  },
});
