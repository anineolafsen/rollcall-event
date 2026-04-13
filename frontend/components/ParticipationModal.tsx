import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface Invitation {
  invitationId: number;
  tripID: number;
  userEmail: string;
}

interface Trip {
  tripID: number;
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

interface ParticipationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ParticipationModal({ visible, onClose }: ParticipationModalProps) {
  const [invitations, setInvitations] = useState<InvitationWithTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchInvitations();
    }
  }, [visible]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all invitations
      const invitationsResponse = await fetch(`${API_BASE_URL}/api/invitations`);
      if (!invitationsResponse.ok) {
        throw new Error(`Failed to fetch invitations: ${invitationsResponse.status}`);
      }
      const invitationsData: Invitation[] = await invitationsResponse.json();

      // For each invitation, fetch the trip details
      const invitationsWithTrips = await Promise.all(
        invitationsData.map(async (invitation) => {
          try {
            const tripResponse = await fetch(`${API_BASE_URL}/api/trips/${invitation.tripID}`);
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
    } catch {
      setError('Could not load invitations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (invitationId: number) => {
    // TODO: Implement accept invitation logic
    console.log('Accept invitation:', invitationId);
  };

  const handleIgnore = (invitationId: number) => {
    // TODO: Implement ignore invitation logic
    console.log('Ignore invitation:', invitationId);
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
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleAccept(invitation.invitationId)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.ignoreButton]}
            onPress={() => handleIgnore(invitation.invitationId)}
          >
            <Text style={styles.ignoreButtonText}>Ignore</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
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
            keyExtractor={(item) => item.invitation.invitationId.toString()}
            renderItem={renderInvitation}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
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
  closeButton: {
    marginHorizontal: 22,
    marginBottom: 20,
    backgroundColor: '#76b6ee',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
