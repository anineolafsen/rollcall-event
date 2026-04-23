import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from "@clerk/expo";

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
  const {getToken} = useAuth();

  useEffect(() => {
    const fetchTripData = async () => {
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

        // Fetch invitations and participants
        await fetchParticipantStatus(data.tripID);
      } catch {
        setError('Could not load trip details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTripData();
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
        title={trip.name} 
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
    gap: 12,
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
  tripInfoSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d9e8f5',
  },
  tripInfoText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
    lineHeight: 20,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  leftColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#d9e8f5',
  },
  rightColumn: {
    width: 500,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#d9e8f5',
  },
  participantTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#090909',
    marginBottom: 12,
  },
  participantList: {
    flex: 1,
  },
  noParticipants: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusCircleAccepted: {
    backgroundColor: '#10b981',
  },
  statusCircleInvited: {
    backgroundColor: '#f97316',
  },
  participantEmail: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
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
