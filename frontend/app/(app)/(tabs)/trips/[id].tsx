import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';

import { UpcomingEventsScreen } from '@/components/upcoming-events';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

interface Trip {
  tripID: number;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
}

interface Invitation {
  tripID: number;
  userEmail: string;
}

interface Participant {
  participantID: number;
  tripID: number;
  userID: string;
}

interface ParticipantStatus {
  email: string;
  status: 'accepted' | 'invited';
}

export default function TripDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantStatus[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trips/${id}`);
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
  }, [id]);

  const fetchParticipantStatus = async (tripId: number) => {
    setLoadingStats(true);
    try {
      // Fetch participants (accepted)
      const participantsResponse = await fetch(`${API_BASE_URL}/api/participants/trip/${tripId}`);
      const participantsData: Participant[] = participantsResponse.ok ? await participantsResponse.json() : [];

      // Fetch invitations (invited)
      const invitationsResponse = await fetch(`${API_BASE_URL}/api/invitations?tripId=${tripId}`);
      const invitationsData: Invitation[] = invitationsResponse.ok ? await invitationsResponse.json() : [];

      // Combine and deduplicate
      const statusMap = new Map<string, ParticipantStatus>();

      // Add accepted participants
      participantsData.forEach((p) => {
        if (p.userID && !statusMap.has(p.userID)) {
          statusMap.set(p.userID, {
            email: p.userID, // Using userID as a unique identifier
            status: 'accepted',
          });
        }
      });

      // Add invited
      invitationsData.forEach((inv) => {
        if (!statusMap.has(inv.userEmail)) {
          statusMap.set(inv.userEmail, {
            email: inv.userEmail,
            status: 'invited',
          });
        }
      });

      setParticipants(Array.from(statusMap.values()));
    } catch (err) {
      console.error('Failed to fetch participant status:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

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
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/trips")}>
          <Text style={styles.backButtonText}>← Go back</Text>
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Trip not found'}</Text>
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
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() =>
              router.push({
                pathname: '/trips/[id]/manage-invitations',
                params: { id: trip.tripID, tripName: trip.name },
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
                params: { id: trip.tripID },
              })
            }
          >
            <Text style={styles.editButtonText}>✎ Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Trip Info Section */}
      <View style={styles.tripInfoSection}>
        {trip.startDate && trip.endDate && (
          <Text style={styles.tripInfoText}>
            📅 {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </Text>
        )}
        {trip.location && (
          <Text style={styles.tripInfoText}>
            📍 {trip.location}
          </Text>
        )}
        {trip.description && (
          <Text style={styles.tripInfoText}>
            {trip.description}
          </Text>
        )}
      </View>

      {/* Two Column Layout: Events (left) and Participant Status (right) */}
      <View style={styles.contentContainer}>
        <View style={styles.leftColumn}>
          <UpcomingEventsScreen tripId={trip.tripID} title={trip.name} showBackButton={false} />
        </View>

        <View style={styles.rightColumn}>
          <Text style={styles.participantTitle}>Participant Status</Text>
          {loadingStats ? (
            <ActivityIndicator size="small" color="#76b6ee" />
          ) : (
            <ScrollView style={styles.participantList}>
              {participants.length === 0 ? (
                <Text style={styles.noParticipants}>No participants or invitations yet</Text>
              ) : (
                participants.map((p, index) => (
                  <View key={index} style={styles.participantRow}>
                    <View
                      style={[
                        styles.statusCircle,
                        p.status === 'accepted'
                          ? styles.statusCircleAccepted
                          : styles.statusCircleInvited,
                      ]}
                    />
                    <Text style={styles.participantEmail} numberOfLines={1}>
                      {p.email}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
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
