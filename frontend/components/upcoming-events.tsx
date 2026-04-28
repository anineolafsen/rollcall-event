import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { useAuth, useUser } from "@clerk/expo";

import { EventCard } from '@/components/event-card';
import { AppButton } from '@/components/ui/button';
import { CheckInMethodModal } from '@/components/ui/checkin/Checkin-method-modal';
import { getUpcomingEvents } from '@/lib/event-format';
import { checkinService } from '@/services/checkinService';
import { getEvents, joinEvent, leaveEvent, type EventRecord } from '@/lib/events';

type UpcomingEventsScreenProps = {
  tripId?: string | number;
  title?: string;
  showBackButton?: boolean;
  isOrganizer?: boolean;
};

export function UpcomingEventsScreen({
  tripId,
  title = 'Upcoming Events',
  showBackButton = false,
  isOrganizer = false,
}: UpcomingEventsScreenProps) {
  const POLL_BACKOFF_MS = 60000;
  const ACTIVE_POLL_MS = 5000;
  const IDLE_POLL_MS = 30000;

  const router = useRouter();
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const getTokenRef = useRef(getToken);

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingEventId, setIsUpdatingEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [checkinMethodModalVisible, setCheckinMethodModalVisible] = useState(false);
  const [checkedInEventIds, setCheckedInEventIds] = useState<number[]>([]);
  const [activeParticipantEventIds, setActiveParticipantEventIds] = useState<number[]>([]);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const isFetchingEventsRef = useRef(false);
  const pausedUntilRef = useRef(0);
  const failureCountRef = useRef(0);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [eventToLeave, setEventToLeave] = useState<EventRecord | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleParticipantCheckedIn = (evt: Event) => {
      const customEvent = evt as CustomEvent<{ eventId?: number }>;
      const checkedInEventId = customEvent.detail?.eventId;
      if (!checkedInEventId) {
        return;
      }

      setCheckedInEventIds((prev) => (prev.includes(checkedInEventId) ? prev : [...prev, checkedInEventId]));
    };

    window.addEventListener('rollcall:participant-checked-in', handleParticipantCheckedIn as EventListener);
    return () => {
      window.removeEventListener('rollcall:participant-checked-in', handleParticipantCheckedIn as EventListener);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const isAuthOrNetworkError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();
    return (
      lower.includes('401') ||
      lower.includes('unauthorized') ||
      lower.includes('network') ||
      lower.includes('failed to fetch') ||
      lower.includes('connection_refused')
    );
  }, []);

  const shouldPausePolling = useCallback(() => Date.now() < pausedUntilRef.current, []);

  const recordPollFailure = useCallback((error: unknown) => {
    if (!isAuthOrNetworkError(error)) {
      failureCountRef.current = 0;
      return;
    }

    failureCountRef.current += 1;
    if (failureCountRef.current >= 2) {
      pausedUntilRef.current = Date.now() + POLL_BACKOFF_MS;
    }
  }, [POLL_BACKOFF_MS, isAuthOrNetworkError]);

  const clearPollBackoff = useCallback(() => {
    pausedUntilRef.current = 0;
    failureCountRef.current = 0;
  }, []);

  const refreshParticipantCheckins = useCallback(async (
    eventItems: EventRecord[],
    activeEventIds: number[],
    token?: string | null,
  ) => {
    if (isOrganizer || eventItems.length === 0) {
      setCheckedInEventIds([]);
      return;
    }

    const currentUserEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!currentUserEmail) {
      setCheckedInEventIds([]);
      return;
    }

    const activeEventSet = new Set(activeEventIds);
    const activeEventsInView = eventItems.filter((eventItem) => activeEventSet.has(eventItem.id));

    if (activeEventsInView.length === 0) {
      setCheckedInEventIds((prev) => prev.filter((eventId) => !activeEventSet.has(eventId)));
      return;
    }

    const checkinLookups = await Promise.all(
      activeEventsInView.map(async (eventItem) => {
        if (eventItem.joinButtonState === 'join') {
          return { eventId: eventItem.id, isCheckedIn: false };
        }

        try {
          const participants = await checkinService.getEventParticipants(eventItem.id, token);
          const selfParticipant = participants.find((p) => p.email?.toLowerCase() === currentUserEmail);
          return { eventId: eventItem.id, isCheckedIn: Boolean(selfParticipant?.isCheckedIn) };
        } catch {
          return { eventId: eventItem.id, isCheckedIn: false };
        }
      })
    );

    const checkedInActiveIds = checkinLookups.filter((x) => x.isCheckedIn).map((x) => x.eventId);
    setCheckedInEventIds((prev) => {
      const preservedNonActive = prev.filter((eventId) => !activeEventSet.has(eventId));
      return [...new Set([...preservedNonActive, ...checkedInActiveIds])];
    });
  }, [isOrganizer, user?.primaryEmailAddress?.emailAddress]);

  const refreshParticipantCheckinsForCurrentEvents = useCallback(async () => {
    if (isOrganizer || events.length === 0 || !userId || !isPageVisible) {
      return;
    }

    if (shouldPausePolling()) {
      return;
    }

    try {
      const token = await getTokenRef.current({ template: 'RollCallAuth' });
      const activeLookup = await checkinService.getActiveSessionsForUser(userId, token);
      const activeIdsInView = activeLookup.eventIds.filter((eventId) => events.some((eventItem) => eventItem.id === eventId));
      setActiveParticipantEventIds(activeIdsInView);
      await refreshParticipantCheckins(events, activeIdsInView, token);
      clearPollBackoff();
    } catch (error) {
      recordPollFailure(error);
    }
  }, [clearPollBackoff, events, isOrganizer, isPageVisible, recordPollFailure, refreshParticipantCheckins, shouldPausePolling, userId]);

  const fetchEvents = useCallback(async (force = false) => {
    if (!force && !isPageVisible) {
      return;
    }

    if (!force && shouldPausePolling()) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isFetchingEventsRef.current) {
      return;
    }

    isFetchingEventsRef.current = true;
    try {
      setError(null);
      const token = await getTokenRef.current({ template: "RollCallAuth" });
      const data = await getEvents(tripId, token);
      const upcoming = getUpcomingEvents(data);
      setEvents(upcoming);
      if (!isOrganizer && userId) {
        const activeLookup = await checkinService.getActiveSessionsForUser(userId, token);
        const activeIdsInView = activeLookup.eventIds.filter((eventId) => upcoming.some((eventItem) => eventItem.id === eventId));
        setActiveParticipantEventIds(activeIdsInView);
        await refreshParticipantCheckins(upcoming, activeIdsInView, token);
      }
      clearPollBackoff();
    } catch (error) {
      recordPollFailure(error);
      setError('Could not load events for this trip.');
    } finally {
      isFetchingEventsRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [clearPollBackoff, isOrganizer, isPageVisible, recordPollFailure, refreshParticipantCheckins, shouldPausePolling, tripId, userId]);

  useFocusEffect(
    useCallback(() => {
      void fetchEvents();
    }, [fetchEvents])
  );

  useEffect(() => {
    if (!isOrganizer || !isPageVisible) {
      return;
    }

    const pollMs = events.some((eventItem) => eventItem.isSelfCheckinActive) ? ACTIVE_POLL_MS : IDLE_POLL_MS;

    const intervalId = setInterval(() => {
      void fetchEvents();
    }, pollMs);

    return () => clearInterval(intervalId);
  }, [events, fetchEvents, isOrganizer, isPageVisible]);

  useEffect(() => {
    if (isOrganizer || !isPageVisible) {
      return;
    }

    const pollMs = activeParticipantEventIds.length > 0 ? ACTIVE_POLL_MS : IDLE_POLL_MS;

    const intervalId = setInterval(() => {
      void refreshParticipantCheckinsForCurrentEvents();
    }, pollMs);

    return () => clearInterval(intervalId);
  }, [activeParticipantEventIds.length, isOrganizer, isPageVisible, refreshParticipantCheckinsForCurrentEvents]);

  const onRefresh = () => {
    clearPollBackoff();
    setRefreshing(true);
    void fetchEvents(true);
  };

  const handleJoinLeave = async (eventItem: EventRecord) => {
    try {
      setIsUpdatingEventId(eventItem.id);
      const token = await getTokenRef.current({ template: 'RollCallAuth' });

      if (eventItem.joinButtonState === 'leave') {
        setEventToLeave(eventItem);
        setShowLeaveModal(true);
        setIsUpdatingEventId(null);
        return;
      } else {
        await joinEvent(eventItem.id, token);
      }

      await fetchEvents(true);
    } catch {
      setError('Could not update event participation.');
    } finally {
      setIsUpdatingEventId(null);
    }
  };

  const handleLeaveWithReason = async () => {
    if (!eventToLeave) return;

    try {
      const token = await getTokenRef.current({ template: 'RollCallAuth' });
      await leaveEvent(eventToLeave.id, token, leaveReason);
      setShowLeaveModal(false);
      setLeaveReason('');
      setEventToLeave(null);
      await fetchEvents(true);
    } catch {
      setError('Could not leave event.');
    }
  };

  const handleLeaveWithoutReason = async () => {
    if (!eventToLeave) return;

    try {
      const token = await getTokenRef.current({ template: 'RollCallAuth' });
      await leaveEvent(eventToLeave.id, token);
      setShowLeaveModal(false);
      setLeaveReason('');
      setEventToLeave(null);
      await fetchEvents(true);
    } catch {
      setError('Could not leave event.');
    }
  };

  const openCheckinMethodModal = (eventItem: EventRecord) => {
    setSelectedEvent(eventItem);
    setCheckinMethodModalVisible(true);
  };

  const startSelfCheckin = async () => {
    if (!selectedEvent) {
      return;
    }

    try {
      const token = await getTokenRef.current({ template: 'RollCallAuth' });
      await checkinService.startSession(selectedEvent.id, 'self', 15, token);
      setEvents((prev) => prev.map((eventItem) =>
        eventItem.id === selectedEvent.id
          ? { ...eventItem, isSelfCheckinActive: true }
          : eventItem
      ));
      setCheckinMethodModalVisible(false);
      router.push(`/checkIn?eventId=${encodeURIComponent(String(selectedEvent.id))}&tripId=${encodeURIComponent(String(selectedEvent.tripId))}&isOrganizer=true` as any);
    } catch {
      setError('Could not start self check-in.');
    }
  };

  const startQrCheckin = async () => {
    if (!selectedEvent) {
      return;
    }

    try {
      const token = await getTokenRef.current({ template: 'RollCallAuth' });
      const session = await checkinService.startSession(selectedEvent.id, 'qr', 15, token);
      setCheckinMethodModalVisible(false);
      router.push(
        `/qr-checkin?eventId=${encodeURIComponent(String(selectedEvent.id))}&token=${encodeURIComponent(session.token ?? '')}&expiresAt=${encodeURIComponent(session.expiresAt ?? '')}` as any
      );
    } catch {
      setError('Could not start QR check-in.');
    }
  };

  const getParticipantActionLabel = (eventItem: EventRecord) => {
    if (checkedInEventIds.includes(eventItem.id)) {
      return 'Checked in';
    }

    if (eventItem.joinButtonState === 'leave') {
      return 'Leave';
    }

    if (eventItem.joinButtonState === 'mandatory') {
      return 'Mandatory';
    }

    return 'Join';
  };

  const renderEvent = ({ item }: { item: EventRecord }) => {
    const isSelfCheckinActive = Boolean(item.isSelfCheckinActive);
    const isParticipantCheckinActive = activeParticipantEventIds.includes(item.id);
    const isParticipantCheckedIn = checkedInEventIds.includes(item.id);
    const actionLabel = isOrganizer
      ? isSelfCheckinActive
        ? 'Check-in active'
        : 'Start check-in'
      : getParticipantActionLabel(item);

    const actionVariant: 'start' | 'active' | 'checkedin' | 'join' | 'leave' | 'mandatory' = isOrganizer
      ? isSelfCheckinActive
        ? 'active'
        : 'start'
      : isParticipantCheckedIn
          ? 'checkedin'
        : item.joinButtonState === 'leave'
          ? 'leave'
          : item.joinButtonState === 'mandatory'
            ? 'mandatory'
            : 'join';

    const actionDisabled = isOrganizer
      ? false
      : isUpdatingEventId !== null || (item.joinButtonState === 'mandatory' && !isParticipantCheckinActive) || isParticipantCheckedIn;

    return (
      <EventCard
        event={item}
        onPress={() =>
          router.push({
            pathname: '/events/[id]',
            params: {
              id: String(item.id),
              tripId: String(item.tripId),
            },
          })
        }
        actionLabel={actionLabel}
        actionVariant={actionVariant}
        onActionPress={() => {
          if (isOrganizer) {
            if (isSelfCheckinActive) {
              router.push(`/checkIn?eventId=${encodeURIComponent(String(item.id))}&tripId=${encodeURIComponent(String(item.tripId))}&isOrganizer=true` as any);
              return;
            }
            openCheckinMethodModal(item);
            return;
          }

          void handleJoinLeave(item);
        }}
        actionDisabled={actionDisabled}
      />
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Go back</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.title}>{title}</Text>
        <View style={styles.titleDivider} />

        {/* SECURITY: Only show Create button if user is an organizer */}
        {tripId && isOrganizer ? (
          <View style={styles.createRow}>
            <AppButton
              variant="create"
              style={styles.createButtonTop}
              textStyle={styles.createButtonText}
              label="Create event +"
              onPress={() => router.push(`/events/create?tripId=${tripId}`)}
            />

            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={() =>
                router.push(`/events/create?tripId=${tripId}&emergency=true`)
              }
            >
              <Image
                source={require('@/assets/images/siren.png')}
                style={{ width: '100%', height: '100%', borderRadius: 10 }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.timelineSection}>
          <View style={styles.timelineRail} />
          <View style={styles.timelineContent}>
            {loading && !refreshing ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#76b6ee" />
              </View>
            ) : error ? (
              <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => { void fetchEvents(true); }}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : events.length === 0 ? (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>No upcoming events found.</Text>
              </View>
            ) : (
              <FlatList
                data={events}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderEvent}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#76b6ee"
                  />
                }
              />
            )}
          </View>
        </View>

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
    </SafeAreaView>
  );
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
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    textAlign: 'center',
    color: '#090909',
  },
  titleDivider: {
    height: 3,
    backgroundColor: '#75baf0',
    borderRadius: 999,
    marginTop: 5,
    marginBottom: 18,
    marginHorizontal: 12,
  },
  createButtonTop: {
    alignSelf: 'center',
    marginBottom: 24,
    minWidth: 280,
  },
  createButtonText: {
    fontSize: 26,
  },
  timelineSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineRail: {
    width: 16,
    backgroundColor: '#75baf0',
    marginRight: 22,
    marginBottom: -28,
  },
  timelineContent: {
    flex: 1,
  },
  listContent: {
    gap: 22,
    paddingTop: 2,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
  errorText: {
    fontSize: 14,
    color: '#b0413e',
    textAlign: 'center',
    marginBottom: 14,
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
  createRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },

  emergencyButton: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
  },

  emergencyIcon: {
    fontSize: 26,
  }, 
});
