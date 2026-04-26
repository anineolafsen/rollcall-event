import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuth } from "@clerk/expo";

import { UpcomingEventsScreen } from '@/components/upcoming-events';
import { useMobileTripStore } from '@/lib/mobile-trip-store';

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
  const {getToken} = useAuth();
  const setSelectedTripId = useMobileTripStore((state) => state.setSelectedTripId);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const token = await getToken({ template: "RollCallAuth" });
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
        setSelectedTripId(data.id);
      } catch {
        setError('Could not load trip details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTrip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, setSelectedTripId]); // getToken is stable

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
          <TouchableOpacity style={styles.backButton} onPress={() => router.push("/trips")}>
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
        <Text style={styles.tripTitle}>{trip.name}</Text>
        
        {/* Only show management buttons if the user is an Organizer */}
        {trip.isOrganizer && (
            <View style={styles.buttonRow}>
            <TouchableOpacity
                style={styles.inviteButton}
                onPress={() =>
                router.push({
                    pathname: '/trips/[id]/manage-invitations',
                    params: { id: String(trip.id), tripId: trip.id, tripName: trip.name },
                })
                }
            >
                <Text style={styles.inviteButtonText}>+ Manage Invitations</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.needsButton}
                onPress={() =>
                router.push({
                    pathname: '/trips/[id]/participant-needs',
                    params: { id: String(trip.id), tripName: trip.name },
                })
                }
            >
                <Text style={styles.needsButtonText}>View Needs</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                router.push({
                    pathname: '/trips/create',
                    params: { id: trip.id },
                })
                }
            >
                <Text style={styles.editButtonText}>✎ Edit</Text>
            </TouchableOpacity>
            </View>
        )}
      </View>
      <UpcomingEventsScreen 
        tripId={trip.id} 
        title="Upcoming Events" 
        showBackButton={false} 
        isOrganizer={trip.isOrganizer} 
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d9e8f5',
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
  tripTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#090909',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
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
