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
  const { id, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: string }>();
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

  const fetchEvent = useCallback(async () => {
    try {
      const token = await getToken({ template: "RollCallAuth" });
      const data = await getEventById(String(id), token);
      const nextEvent = data as SecureEventRecord;
      setEvent(nextEvent);
      if (nextEvent.isOrganizer) {
        const activeSession = await checkinService.getActiveSessionForEvent(String(id), 'self', token);
        setIsSelfCheckinActive(Boolean(activeSession.isActive));
        setIsParticipantCheckedIn(false);
      } else {
        setIsSelfCheckinActive(false);
        const currentUserEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
        if (!currentUserEmail || nextEvent.joinButtonState !== 'leave') {
          setIsParticipantCheckedIn(false);
        } else {
          try {
            const participants = await checkinService.getEventParticipants(String(id), token);
            const selfParticipant = participants.find((p) => p.email?.toLowerCase() === currentUserEmail);
            setIsParticipantCheckedIn(Boolean(selfParticipant?.isCheckedIn));
          } catch {
            setIsParticipantCheckedIn(false);
          }
        }
      }
    } catch {
      setError('Could not load event details.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.primaryEmailAddress?.emailAddress]);

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
    }, 5000);

    return () => clearInterval(intervalId);
  }, [event?.isOrganizer, fetchEvent, id]);

  const handleGoBack = () => {
    if (returnTo) {
      router.replace(returnTo as any);
      return;
    }

    router.back();
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
    const token = await getToken({ template: "RollCallAuth" });
    const data = await getEventById(String(id), token);
    const nextEvent = data as SecureEventRecord;
    setEvent(nextEvent);
    if (nextEvent.isOrganizer) {
      const activeSession = await checkinService.getActiveSessionForEvent(String(id), 'self', token);
      setIsSelfCheckinActive(Boolean(activeSession.isActive));
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
  };

  const handleJoinLeave = async () => {
    if (!event) {
      return;
    }

    try {
      setIsUpdatingParticipation(true);
      const token = await getToken({ template: "RollCallAuth" });
      if (event.joinButtonState === 'leave') {
        await leaveEvent(String(id), token);
      } else {
        await joinEvent(String(id), token);
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
          <View style={styles.actionRow}>
            <AppButton
              variant="default"
              style={[styles.actionButton, isParticipantCheckedIn ? styles.activeCheckinButton : null]}
              textStyle={isParticipantCheckedIn ? styles.activeCheckinButtonText : undefined}
              label={isUpdatingParticipation ? 'Updating...' : attendeeButtonLabel}
              onPress={handleJoinLeave}
              disabled={isUpdatingParticipation || event.joinButtonState === 'mandatory' || isParticipantCheckedIn}
            />
          </View>
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
});
