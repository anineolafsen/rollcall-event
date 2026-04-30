import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@clerk/expo';

import {
  getTripParticipants,
  promoteParticipantToOrganizer,
  type TripParticipantDto,
} from '@/lib/participants';

export default function TripOrganizersScreen() {
  const { id, tripName } = useLocalSearchParams<{ id?: string; tripName?: string }>();
  const router = useRouter();
  const { getToken } = useAuth();

  const [participants, setParticipants] = useState<TripParticipantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promotingUserId, setPromotingUserId] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error' | null>(null);
  const [feedbackUserId, setFeedbackUserId] = useState<number | null>(null);

  useEffect(() => {
    const loadParticipants = async () => {
      if (!id) {
        setError('Trip not found.');
        setLoading(false);
        return;
      }

      try {
        const token = await getToken({ template: 'RollCallAuth' });
        const data = await getTripParticipants(Number(id), token);
        setParticipants(data);
        setError(null);
      } catch {
        setError('Could not load trip participants.');
      } finally {
        setLoading(false);
      }
    };

    void loadParticipants();
  }, [getToken, id]);

  const organizers = useMemo(
    () => participants.filter((participant) => participant.isOrganizer),
    [participants]
  );
  const regularParticipants = useMemo(
    () => participants.filter((participant) => !participant.isOrganizer),
    [participants]
  );

  const displayName = (participant: TripParticipantDto) =>
    participant.name.trim() || participant.email;

  const handlePromote = async (userId: number) => {
    if (!id) {
      return;
    }

    const participant = participants.find((item) => item.userId === userId);
    const participantName = participant ? displayName(participant) : 'This person';

    try {
      setPromotingUserId(userId);
      setFeedbackMessage(null);
      setFeedbackTone(null);
      setFeedbackUserId(null);
      const token = await getToken({ template: 'RollCallAuth' });
      const updated = await promoteParticipantToOrganizer(Number(id), userId, token);
      setParticipants((current) =>
        current
          .map((participant) =>
            participant.userId === updated.userId
              ? { ...participant, isOrganizer: true }
              : participant
          )
          .sort((left, right) => {
            if (left.isOrganizer !== right.isOrganizer) {
              return left.isOrganizer ? -1 : 1;
            }

            return displayName(left).localeCompare(displayName(right));
          })
      );
      setError(null);
      setFeedbackTone('success');
      setFeedbackUserId(userId);
      setFeedbackMessage(`${participantName} is now added as an organizer.`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not add this person as an organizer.';

      setFeedbackTone('error');
      setFeedbackUserId(userId);
      if (message === 'HTTP 404') {
        setFeedbackMessage(
          `Could not add ${participantName} as an organizer. Backend restart may be needed.`
        );
      } else if (message === 'HTTP 403') {
        setFeedbackMessage(
          `Could not add ${participantName} as an organizer. You do not have organizer access.`
        );
      } else if (message === 'Participant not found in this trip.') {
        setFeedbackMessage(message);
      } else {
        setFeedbackMessage(`Could not add ${participantName} as an organizer. ${message}`);
      }
    } finally {
      setPromotingUserId(null);
    }
  };

  const renderParticipantRow = (participant: TripParticipantDto) => (
    <View key={participant.userId} style={styles.participantCard}>
      <View style={styles.participantRow}>
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>{displayName(participant)}</Text>
          <Text style={styles.participantEmail}>{participant.email}</Text>
        </View>

        {participant.isOrganizer ? (
          <View style={styles.organizerBadge}>
            <Text style={styles.organizerBadgeText}>Organizer</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.promoteButton,
              promotingUserId === participant.userId && styles.promoteButtonDisabled,
            ]}
            disabled={promotingUserId === participant.userId}
            onPress={() => void handlePromote(participant.userId)}
          >
            <Text style={styles.promoteButtonText}>
              {promotingUserId === participant.userId ? 'Adding...' : 'Add organizer'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {feedbackUserId === participant.userId && feedbackMessage ? (
        <Text
          style={[
            styles.rowFeedbackMessage,
            feedbackTone === 'success' ? styles.feedbackSuccess : styles.feedbackError,
          ]}
        >
          {feedbackMessage}
        </Text>
      ) : null}
    </View>
  );

  const content = (
    <>
      {organizers.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Current organizers</Text>
          {organizers.map(renderParticipantRow)}
        </>
      ) : null}

      <Text style={[styles.sectionLabel, organizers.length > 0 && styles.secondSectionLabel]}>
        Participants
      </Text>

      {regularParticipants.length > 0 ? (
        regularParticipants.map(renderParticipantRow)
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Everyone in this trip is already an organizer.</Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Go back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Organizer</Text>
        {tripName ? <Text style={styles.tripName}>{tripName}</Text> : null}
        <View style={styles.divider} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#76b6ee" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={content}
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: '#eef5fb',
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
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#090909',
    textAlign: 'center',
    marginBottom: 2,
  },
  tripName: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  feedbackSuccess: {
    color: '#166534',
  },
  feedbackError: {
    color: '#b0413e',
  },
  divider: {
    height: 3,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 28,
    marginHorizontal: 28,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4a7ca8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  secondSectionLabel: {
    marginTop: 24,
  },
  participantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e8f5',
    padding: 14,
    marginBottom: 10,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#090909',
    marginBottom: 4,
  },
  participantEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
  organizerBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  organizerBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  promoteButton: {
    backgroundColor: '#4a7ca8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  promoteButtonDisabled: {
    opacity: 0.7,
  },
  promoteButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  rowFeedbackMessage: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e8f5',
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  errorText: {
    fontSize: 14,
    color: '#b0413e',
    textAlign: 'center',
  },
});
