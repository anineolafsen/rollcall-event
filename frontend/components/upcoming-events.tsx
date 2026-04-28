import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useAuth, useUser } from "@clerk/expo";
import { Bell, Plus } from 'lucide-react-native';

import { EventCard } from '@/components/event-card';
import { AppButton } from '@/components/ui/button';
import { CheckInMethodModal } from '@/components/ui/checkin/Checkin-method-modal';
import { getUpcomingEvents } from '@/lib/event-format';
import { useMobileTripStore } from '@/lib/mobile-trip-store';
import { checkinService } from '@/services/checkinService';
import { getEvents, joinEvent, leaveEvent, type EventRecord } from '@/lib/events';

type UpcomingEventsScreenProps = {
  tripId?: string | number;
  title?: string;
  showBackButton?: boolean;
  isOrganizer?: boolean;
  actionsBelowHeader?: React.ReactNode;
  titleTopOffset?: number;
  titleDividerHorizontalMargin?: number;
  titleDividerTopMargin?: number;
};

export function UpcomingEventsScreen({
  tripId,
  title = 'Upcoming Events',
  showBackButton = false,
  isOrganizer = false,
  actionsBelowHeader,
  titleTopOffset,
  titleDividerHorizontalMargin,
  titleDividerTopMargin,
}: UpcomingEventsScreenProps) {
  const POLL_BACKOFF_MS = 60000;
  const ACTIVE_POLL_MS = 5000;
  const IDLE_POLL_MS = 30000;

  const router = useRouter();
  const { width } = useWindowDimensions();
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const getTokenRef = useRef(getToken);
  const eventsByTrip = useMobileTripStore((state) => state.eventsByTrip);
  const setTripEvents = useMobileTripStore((state) => state.setTripEvents);
  const tripCacheKey = tripId == null ? null : String(tripId);
  const cachedEvents = useMemo(
    () => (tripCacheKey ? eventsByTrip[tripCacheKey] ?? [] : []),
    [eventsByTrip, tripCacheKey]
  );

  const [events, setEvents] = useState<EventRecord[]>(cachedEvents);
  const [loading, setLoading] = useState(cachedEvents.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingEventId, setIsUpdatingEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [checkinMethodModalVisible, setCheckinMethodModalVisible] = useState(false);
  const [checkedInEventIds, setCheckedInEventIds] = useState<number[]>([]);
  const [activeParticipantEventIds, setActiveParticipantEventIds] = useState<number[]>([]);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const isFetchingEventsRef = useRef(false);
  const activeRequestIdRef = useRef(0);
  const pausedUntilRef = useRef(0);
  const failureCountRef = useRef(0);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [eventToLeave, setEventToLeave] = useState<EventRecord | null>(null);
  const showDesktopBackButton = Platform.OS === 'web' && width >= 900;
  const showMobileHeaderDivider = !showDesktopBackButton;
  const showMobileHeaderActions = Boolean(tripId && isOrganizer && !showDesktopBackButton);
  const showEventLocation = showDesktopBackButton;

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

  useEffect(() => {
    activeRequestIdRef.current += 1;
    isFetchingEventsRef.current = false;
    setEvents(cachedEvents);
    setLoading(cachedEvents.length === 0);
    setRefreshing(false);
    setError(null);
    setCheckedInEventIds([]);
    setActiveParticipantEventIds([]);
    setIsUpdatingEventId(null);
    setSelectedEvent(null);
    setCheckinMethodModalVisible(false);
    setShowLeaveModal(false);
    setLeaveReason('');
    setEventToLeave(null);
  }, [cachedEvents, isOrganizer, tripId]);

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
    const requestId = activeRequestIdRef.current;

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

      if (requestId !== activeRequestIdRef.current) {
        return;
      }

      setEvents(upcoming);
      if (tripCacheKey) {
        setTripEvents(tripCacheKey, upcoming);
      }
      if (!isOrganizer && userId) {
        const activeLookup = await checkinService.getActiveSessionsForUser(userId, token);
        const activeIdsInView = activeLookup.eventIds.filter((eventId) => upcoming.some((eventItem) => eventItem.id === eventId));
        if (requestId !== activeRequestIdRef.current) {
          return;
        }
        setActiveParticipantEventIds(activeIdsInView);
        await refreshParticipantCheckins(upcoming, activeIdsInView, token);
      }
      clearPollBackoff();
    } catch (error) {
      if (requestId !== activeRequestIdRef.current) {
        return;
      }
      recordPollFailure(error);
      setError('Could not load events for this trip.');
    } finally {
      if (requestId === activeRequestIdRef.current) {
        isFetchingEventsRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [clearPollBackoff, isOrganizer, isPageVisible, recordPollFailure, refreshParticipantCheckins, setTripEvents, shouldPausePolling, tripCacheKey, tripId, userId]);

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

  const handleOpenNotify = () => {
    if (!tripId) {
      return;
    }

    router.push({
      pathname: '/trips/[id]/notify',
      params: { id: String(tripId) },
    });
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
        showLocation={showEventLocation}
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
        {showBackButton && showDesktopBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Go back</Text>
          </TouchableOpacity>
        ) : null}

        
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {/* SECURITY: Only show Create button if user is an organizer */}
          {tripId && isOrganizer ? (
            <Pressable
              onPress={() => router.push(`/events/create?tripId=${tripId}`)}
              style={({ pressed, hovered }) => [
                styles.createButton,
                hovered && styles.createButtonHovered,
                pressed && { opacity: 0.8 },
              ]}>
              {({ hovered }) => (
                <Plus size={20} color={hovered ? '#ffffff' : '#4a7ca8'} />
              )}
            </Pressable>
          ) :null}
        </View>
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
    paddingTop: 74,
    paddingBottom: 36,
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
  timelineSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineRail: {
    width: 16,
    backgroundColor: '#75baf0',
    marginRight: 22,
    marginBottom: -36,
  },
  timelineContent: {
    flex: 1,
  },
  listContent: {
    gap: 22,
    paddingTop: 8,
    paddingBottom: 72,
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
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 18,
  position: 'relative',
},
title: {
  fontSize: 28,
  lineHeight: 34,
  fontWeight: '700',
  textAlign: 'center',
  color: '#090909',
},
createButton: {
  position: 'absolute',
  right: 0,
  backgroundColor: '#ffffff',
  borderWidth: 1,
  borderColor: '#4a7ca8',
  borderRadius: 10,
  width: 40,
  height: 40,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#4a7ca8',
  shadowOpacity: 0.15,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
},
createButtonHovered: {
  backgroundColor: '#4a7ca8',
  borderColor: '#4a7ca8',
},
});
