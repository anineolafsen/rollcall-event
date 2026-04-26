import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth, useUser } from "@clerk/expo";
import { AppButton } from '@/components/ui/button';
import { formatAttendanceMode, formatEventDate, formatEventTime } from '@/lib/event-format';
import {
  deleteEvent as deleteEventRequest,
  getEventById,
  joinEvent,
  leaveEvent,
  type EventRecord,
} from '@/lib/events';
import { CheckInMethodModal } from '@/components/ui/checkin/Checkin-method-modal';
import { checkinService } from '@/services/checkinService';

interface SecureEventRecord extends EventRecord {
  isOrganizer: boolean;
}

export default function EventDetailsScreen() {
  const { id, tripId } = useLocalSearchParams<{ id?: string; tripId?: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [event, setEvent] = useState<SecureEventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingParticipation, setIsUpdatingParticipation] = useState(false);
  const [checkinMethodModalVisible, setCheckinMethodModalVisible] = useState(false);
  const [isSelfCheckinActive, setIsSelfCheckinActive] = useState(false);
  const [isParticipantCheckedIn, setIsParticipantCheckedIn] = useState(false);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');

  const applyEventState = useCallback(async (nextEvent: SecureEventRecord, token?: string | null) => {
    setEvent(nextEvent);

    if (nextEvent.isOrganizer) {
      setIsSelfCheckinActive(Boolean(nextEvent.isSelfCheckinActive));
      setIsParticipantCheckedIn(false);
      return;
    }

    setIsSelfCheckinActive(false);
    const currentUserEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!currentUserEmail || nextEvent.joinButtonState !== 'leave') {
      setIsParticipantCheckedIn(false);
      return;
    }

    try {
      const participants = await checkinService.getEventParticipants(String(id), token);
      const selfParticipant = participants.find((p) => p.email?.toLowerCase() === currentUserEmail);
      setIsParticipantCheckedIn(Boolean(selfParticipant?.isCheckedIn));
    } catch {
      setIsParticipantCheckedIn(false);
    }
  }, [id, user?.primaryEmailAddress?.emailAddress]);

  const loadEventDetails = useCallback(async () => {
    const token = await getToken({ template: 'RollCallAuth' });
    const data = await getEventById(String(id), token);
    const nextEvent = data as SecureEventRecord;
    await applyEventState(nextEvent, token);
  }, [applyEventState, getToken, id]);

  const fetchEvent = useCallback(async () => {
    try {
      await loadEventDetails();
    } catch {
      setError('Could not load event details.');
    } finally {
      setLoading(false);
    }
  }, [loadEventDetails]);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id, fetchEvent]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        void fetchEvent();
      }
    }, [fetchEvent, id])
  );

  useEffect(() => {
    if (!event?.isOrganizer || !id) {
      return;
    }

    const intervalId = setInterval(() => {
      void fetchEvent();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [event?.isOrganizer, fetchEvent, id]);

  const handleGoBack = () => {
    const targetTripId = event?.tripId ?? tripId;
    if (targetTripId) {
      router.replace(`/trips/${targetTripId}` as any);
      return;
    }

    router.replace('/trips' as any);
  };

    const handleLeaveWithoutReason = async () => {
    if (!event) return;

    try {
      const token = await getToken();
      const updated = await leaveEvent(event.id, token ?? undefined, undefined);
      setEvent(updated as SecureEventRecord);
      setShowLeaveModal(false);
      setLeaveReason('');
    } catch {
      Alert.alert('Error', 'Could not leave event.');
    }
  };

  const handleLeaveWithReason = async () => {
    if (!event) return;

    try {
      const token = await getToken();
      const updated = await leaveEvent(event.id, token ?? undefined, leaveReason);
      setEvent(updated as SecureEventRecord);
      setShowLeaveModal(false);
      setLeaveReason('');
    } catch {
      Alert.alert('Error', 'Could not leave event.');
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

  if (error || !event) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>← Go back</Text>
          </TouchableOpacity>
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error || 'Event not found'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const capacityText = event.hasUnlimitedCapacity
    ? 'No participant limit'
    : event.capacity
      ? `${event.capacity} participants`
      : 'Not specified';

  const confirmDeleteEvent = async () => {
    try {
      setIsDeleting(true);
      const token = await getToken({ template: "RollCallAuth" });
      await deleteEventRequest(String(id), token);
      router.replace(`/trips/${event.tripId}`);
    } catch {
      Alert.alert('Error', 'Could not delete event.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    const message = 'Are you sure you want to delete this event?';

    if (Platform.OS === 'web') {
      const didConfirmDelete = window.confirm(message);

      if (didConfirmDelete) {
        void confirmDeleteEvent();
      }

      return;
    }

    Alert.alert('Delete event', message, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void confirmDeleteEvent();
        },
      },
    ]);
  };

  const refreshEvent = async () => {
    await loadEventDetails();
  };

  const handleJoinLeave = async () => {
    if (!event) {
      return;
    }

    try {
      setIsUpdatingParticipation(true);
      const token = await getToken({ template: "RollCallAuth" });
      if (event.joinButtonState === 'leave') {
        setShowLeaveModal(true);
      } else {
        const updated = await joinEvent(String(id), token);
        setEvent(updated as SecureEventRecord);
      }

      await refreshEvent();
    } catch {
      Alert.alert('Error', 'Could not update event participation.');
    } finally {
      setIsUpdatingParticipation(false);
    }
  };

  const startSelfCheckin = async () => {
    if (!event) {
      return;
    }

    try {
      const token = await getToken({ template: "RollCallAuth" });
      await checkinService.startSession(event.id, 'self', 15, token);
      setIsSelfCheckinActive(true);
      setCheckinMethodModalVisible(false);
      router.push(`/checkIn?eventId=${encodeURIComponent(String(event.id))}&tripId=${encodeURIComponent(String(event.tripId))}&isOrganizer=true` as any);
    } catch {
      Alert.alert('Error', 'Could not start self check-in.');
    }
  };

  const startQrCheckin = async () => {
    if (!event) {
      return;
    }

    try {
      const token = await getToken({ template: "RollCallAuth" });
      const session = await checkinService.startSession(event.id, 'qr', 15, token);
      setCheckinMethodModalVisible(false);
      router.push(
        `/qr-checkin?eventId=${encodeURIComponent(String(event.id))}&token=${encodeURIComponent(session.token ?? '')}&expiresAt=${encodeURIComponent(session.expiresAt ?? '')}` as any
      );
    } catch {
      Alert.alert('Error', 'Could not start QR check-in.');
    }
  };

  const attendeeButtonLabel =
    isParticipantCheckedIn
      ? 'Checked in'
      : event.joinButtonState === 'leave'
      ? 'Leave'
      : event.joinButtonState === 'mandatory'
        ? 'Mandatory'
        : 'Join';

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>← Go back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{event.name}</Text>
        <View style={styles.titleDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date And Time</Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>{formatEventDate(event.startDate)}</Text>
              <Text style={styles.timeValue}>{formatEventTime(event.startDate)}</Text>
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>{formatEventDate(event.endDate)}</Text>
              <Text style={styles.timeValue}>{formatEventTime(event.endDate)}</Text>
            </View>
          </View>
        </View>

        {event.location && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Location</Text>
            <Text style={styles.sectionValue}>{event.location}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Attendance</Text>
          <Text style={styles.sectionValue}>{formatAttendanceMode(event.attendanceMode)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Capacity</Text>
          <Text style={styles.sectionValue}>{capacityText}</Text>
        </View>

        {event.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        {/* Organizer check-in controls */}
        {event.isOrganizer && (
          <View style={styles.actionRow}>
            <AppButton
              variant="default"
              style={[styles.actionButton, isSelfCheckinActive ? styles.activeCheckinButton : null]}
              textStyle={isSelfCheckinActive ? styles.activeCheckinButtonText : undefined}
              label={isSelfCheckinActive ? 'Check-in active' : 'Start check-in'}
              onPress={() => {
                if (isSelfCheckinActive) {
                  router.push(`/checkIn?eventId=${encodeURIComponent(String(event.id))}&tripId=${encodeURIComponent(String(event.tripId))}&isOrganizer=true` as any);
                  return;
                }
                setCheckinMethodModalVisible(true);
              }}
            />
          </View>
        )}

        {/* Participant join/leave controls */}
        {!event.isOrganizer && (
          <>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.joinLeaveButton,
                  isParticipantCheckedIn && styles.joinLeaveButtonCheckedIn,
                  event.joinButtonState === 'leave' && !isParticipantCheckedIn && styles.joinLeaveButtonLeave,
                  event.joinButtonState === 'mandatory' && styles.joinLeaveButtonMandatory,
                  (!isParticipantCheckedIn && event.joinButtonState !== 'leave' && event.joinButtonState !== 'mandatory') && styles.joinLeaveButtonJoin,
                  (isUpdatingParticipation || event.joinButtonState === 'mandatory' || isParticipantCheckedIn) && styles.joinLeaveButtonDisabled,
                ]}
                onPress={handleJoinLeave}
                disabled={isUpdatingParticipation || event.joinButtonState === 'mandatory' || isParticipantCheckedIn}
                activeOpacity={0.85}
              >
                <Text style={[
                  styles.joinLeaveButtonText,
                  event.joinButtonState === 'leave' && !isParticipantCheckedIn && styles.joinLeaveButtonTextLeave,
                  event.joinButtonState === 'mandatory' && styles.joinLeaveButtonTextMandatory,
                ]}>
                  {isUpdatingParticipation ? 'Updating...' : attendeeButtonLabel}
                </Text>
              </TouchableOpacity>
            </View>
            <Modal visible={showLeaveModal} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Leave event</Text>

                  <Text style={{ marginBottom: 8 }}>
                    Why are you not attending:
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Reason (optional)"
                    value={leaveReason}
                    onChangeText={setLeaveReason}
                    multiline
                  />

                  <View style={styles.modalButtons}>
                    <AppButton
                      variant="edit"
                      label="Cancel"
                      onPress={() => setShowLeaveModal(false)}
                    />

                    <AppButton
                      variant="delete"
                      label="Leave"
                      onPress={handleLeaveWithReason}
                    />

                    <TouchableOpacity onPress={handleLeaveWithoutReason}>
                      <Text style={styles.skipText}>Leave without reason</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
          </Modal>
        </>
        )}

        {/* SECURITY: Only show Edit/Delete buttons if the user is an Organizer */}
        {event.isOrganizer && (
            <View style={styles.actionRow}>
            <AppButton
                variant="edit"
                style={styles.actionButton}
                label="Edit"
                onPress={() => router.push(`/events/${id}/edit`)}>
            </AppButton>

            <AppButton
                variant="delete"
                style={styles.actionButton}
                label={isDeleting ? 'Deleting...' : 'Delete'}
                onPress={handleDelete}
                disabled={isDeleting}
            />
            </View>
        )}

        <CheckInMethodModal
          visible={checkinMethodModalVisible}
          onClose={() => setCheckinMethodModalVisible(false)}
          onSelectSelfCheckIn={() => {
            void startSelfCheckin();
          }}
          onSelectQrCheckIn={() => {
            void startQrCheckin();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f1ec',
  },
  content: {
    // flex: 1, -- (forslag) jeg kommenterte ut så man kan scrolle helt ned, men bare å ta bort igjen
    backgroundColor: '#eef5fb',
    paddingHorizontal: 22,
    paddingTop: 80,
    paddingBottom: 80,
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
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    color: '#090909',
  },
  titleDivider: {
    height: 3,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d9e8f5',
  },
  sectionLabel: {
    fontSize: 11,
    color: '#7a9ab8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontWeight: '600',
  },
  sectionValue: {
    fontSize: 16,
    color: '#090909',
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#7a9ab8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3d5c',
  },
  timeValue: {
    marginTop: 4,
    fontSize: 14,
    color: '#4a7ca8',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#5a7a94',
    lineHeight: 21,
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
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
  },
  activeCheckinButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9e8f5',
  },
  activeCheckinButtonText: {
    color: '#111111',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    marginBottom: 12,
  },

  modalButtons: {
    gap: 8,
  },

  skipText: {
    marginTop: 8,
    textAlign: 'right',
    color: '#7a9ab8',
    fontSize: 13,
  },
  joinLeaveButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  joinLeaveButtonJoin: {
    backgroundColor: '#77c88a',
    borderColor: '#4c915f',
  },
  joinLeaveButtonLeave: {
    backgroundColor: '#ff6f80',
    borderColor: '#d45162',
  },
  joinLeaveButtonMandatory: {
    backgroundColor: '#d9dd8a',
    borderColor: '#a9ac5f',
  },
  joinLeaveButtonCheckedIn: {
    backgroundColor: '#ffffff',
    borderColor: '#7e8d9a',
  },
  joinLeaveButtonDisabled: {
    opacity: 0.6,
  },
  joinLeaveButtonText: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  joinLeaveButtonTextLeave: {
    color: '#111111',
  },
  joinLeaveButtonTextMandatory: {
    color: '#111111',
  },
});
