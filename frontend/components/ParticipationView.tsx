import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth, useUser } from '@clerk/expo';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface Invitation {
  id: number;
  tripID: number;
  email: string;
}

interface Trip {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  destination?: string;
  description?: string;
}

interface InvitationWithTrip {
  invitation: Invitation;
  trip: Trip | null;
}

export function ParticipationView() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [invitations, setInvitations] = useState<InvitationWithTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // Securely fetch invitations for the logged-in user through the auth token
      const invitationsResponse = await fetch(
        `${API_BASE_URL}/api/invitations/my`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!invitationsResponse.ok) {
        throw new Error(`Failed to fetch invitations: ${invitationsResponse.status}`);
      }
      const invitationsData: Invitation[] = await invitationsResponse.json();

      // For each invitation, fetch the trip details
      const invitationsWithTrips = await Promise.all(
        invitationsData.map(async (invitation) => {
          try {
            const tripResponse = await fetch(`${API_BASE_URL}/api/trips/${invitation.tripID}`, {
               headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (tripResponse.ok) {
              const tripData: Trip = await tripResponse.json();
              return { invitation, trip: tripData };
            }
            return { invitation, trip: null };
          } catch {
            return { invitation, trip: null };
          }
        })
      );

      setInvitations(invitationsWithTrips);
    } catch (err) {
      setError('Could not load invitations. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleAccept = async (invitationId: number) => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'User authentication not found');
        return;
      }

      setActionInProgress(invitationId);

      // Accept an invitation in a joint backend transaction using the auth token
      const acceptResponse = await fetch(
        `${API_BASE_URL}/api/invitations/accept?invitationId=${invitationId}`,
        { 
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!acceptResponse.ok) {
        throw new Error('Failed to accept invitation on server');
      }

      // Update UI by removing the accepted invitation
      setInvitations((prev) =>
        prev.filter((item) => item.invitation.id !== invitationId)
      );

      Alert.alert('Success', 'You have accepted the invitation!');
    } catch (err) {
      Alert.alert('Error', 'Failed to accept invitation. Please try again.');
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleIgnore = async (invitationId: number, tripId: number, email: string) => {
    try {
      setActionInProgress(invitationId);

      const response = await fetch(
        `${API_BASE_URL}/api/invitations?tripId=${tripId}&email=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to ignore invitation');
      }

      // Update UI
      setInvitations((prev) =>
        prev.filter((item) => item.invitation.id !== invitationId)
      );

      Alert.alert('Success', 'Invitation ignored.');
    } catch (err) {
      Alert.alert('Error', 'Failed to ignore invitation. Please try again.');
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderInvitation = ({ item }: { item: InvitationWithTrip }) => {
    const { invitation, trip } = item;

    if (!trip) {
      return (
        <View style={styles.card}>
          <Text style={styles.errorMessage}>Trip information not available</Text>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.tripName}>{trip.name}</Text>
          {trip.destination && (
            <Text style={styles.destination}>{trip.destination}</Text>
          )}
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.dateRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>From</Text>
            <Text style={styles.dateValue}>{formatDate(trip.startDate)}</Text>
          </View>
          <View style={styles.dateSeparator} />
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>To</Text>
            <Text style={styles.dateValue}>{formatDate(trip.endDate)}</Text>
          </View>
        </View>

        {trip.description ? (
          <Text style={styles.description}>{trip.description}</Text>
        ) : null}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton, actionInProgress === invitation.id && styles.buttonDisabled]}
            onPress={() => handleAccept(invitation.id)}
            disabled={actionInProgress !== null}
          >
            {actionInProgress === invitation.id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.ignoreButton, actionInProgress === invitation.id && styles.buttonDisabled]}
            onPress={() => handleIgnore(invitation.id, invitation.tripID, invitation.email)}
            disabled={actionInProgress !== null}
          >
            {actionInProgress === invitation.id ? (
              <ActivityIndicator size="small" color="#4a7ca8" />
            ) : (
              <Text style={styles.ignoreButtonText}>Ignore</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>My Invitations</Text>
        <View style={styles.titleDivider} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#76b6ee" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInvitations}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : invitations.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No invitations at this time.</Text>
        </View>
      ) : (
        <FlatList
          data={invitations}
          keyExtractor={(item) => item.invitation.id.toString()}
          renderItem={renderInvitation}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    textAlign: 'center',
    color: '#090909',
  },
  titleDivider: {
    height: 3,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
    marginTop: 14,
    marginHorizontal: 28,
  },
  listContent: {
    gap: 14,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d9e8f5',
  },
  cardHeader: {
    marginBottom: 10,
  },
  tripName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#090909',
  },
  destination: {
    fontSize: 13,
    color: '#4a7ca8',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#d9e8f5',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#7a9ab8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a3d5c',
  },
  dateSeparator: {
    width: 1,
    height: 32,
    backgroundColor: '#d9e8f5',
    marginHorizontal: 16,
  },
  description: {
    marginTop: 12,
    fontSize: 13,
    color: '#5a7a94',
    lineHeight: 19,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#4a7ca8',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  ignoreButton: {
    backgroundColor: '#e8ecf1',
    borderWidth: 1,
    borderColor: '#d9e8f5',
  },
  ignoreButtonText: {
    color: '#4a7ca8',
    fontWeight: '600',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  errorText: {
    fontSize: 14,
    color: '#b0413e',
    textAlign: 'center',
    marginBottom: 14,
  },
  errorMessage: {
    fontSize: 13,
    color: '#7a9ab8',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#76b6ee',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    color: '#7a9ab8',
  },
});
