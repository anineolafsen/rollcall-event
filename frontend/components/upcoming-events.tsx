import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
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
  const router = useRouter();
  const pathname = usePathname();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingEventId, setIsUpdatingEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [checkinMethodModalVisible, setCheckinMethodModalVisible] = useState(false);
  const [activeSelfCheckinEventIds, setActiveSelfCheckinEventIds] = useState<number[]>([]);
  const [checkedInEventIds, setCheckedInEventIds] = useState<number[]>([]);

  const refreshActiveSelfSessions = useCallback(async (eventItems: EventRecord[], token?: string | null) => {
    if (!isOrganizer || eventItems.length === 0) {
      setActiveSelfCheckinEventIds([]);
      return;
    }

    const activeLookups = await Promise.all(
      eventItems.map(async (eventItem) => {
        try {
          const active = await checkinService.getActiveSessionForEvent(eventItem.id, 'self', token);
          return { eventId: eventItem.id, isActive: active.isActive };
        } catch {
          return { eventId: eventItem.id, isActive: false };
        }
      })
    );

    setActiveSelfCheckinEventIds(activeLookups.filter((x) => x.isActive).map((x) => x.eventId));
  }, [isOrganizer]);

  const refreshActiveSelfSessionsForCurrentEvents = useCallback(async () => {
    if (!isOrganizer || events.length === 0) {
      return;
    }

    try {
      const token = await getToken({ template: 'RollCallAuth' });
      await refreshActiveSelfSessions(events, token);
    } catch {
      // Keep current state on transient auth/network failures.
    }
  }, [events, getToken, isOrganizer, refreshActiveSelfSessions]);

  const refreshParticipantCheckins = useCallback(async (eventItems: EventRecord[], token?: string | null) => {
    if (isOrganizer || eventItems.length === 0) {
      setCheckedInEventIds([]);
      return;
    }

    const currentUserEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!currentUserEmail) {
      setCheckedInEventIds([]);
      return;
    }

    const checkinLookups = await Promise.all(
      eventItems.map(async (eventItem) => {
        if (eventItem.joinButtonState !== 'leave') {
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

    setCheckedInEventIds(checkinLookups.filter((x) => x.isCheckedIn).map((x) => x.eventId));
  }, [isOrganizer, user?.primaryEmailAddress?.emailAddress]);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken({ template: "RollCallAuth" });
      const data = await getEvents(tripId, token);
      const upcoming = getUpcomingEvents(data);
      setEvents(upcoming);
      await refreshActiveSelfSessions(upcoming, token);
      await refreshParticipantCheckins(upcoming, token);
    } catch {
      setError('Could not load events for this trip.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, refreshActiveSelfSessions, refreshParticipantCheckins]); // getToken is stable

  useFocusEffect(
    useCallback(() => {
      void fetchEvents();
      void refreshActiveSelfSessionsForCurrentEvents();
    }, [fetchEvents])
  );

  useEffect(() => {
    if (!isOrganizer) {
      return;
    }

    const intervalId = setInterval(() => {
      void refreshActiveSelfSessionsForCurrentEvents();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isOrganizer, refreshActiveSelfSessionsForCurrentEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleJoinLeave = async (eventItem: EventRecord) => {
    try {
      setIsUpdatingEventId(eventItem.id);
      const token = await getToken({ template: 'RollCallAuth' });

      if (eventItem.joinButtonState === 'leave') {
        await leaveEvent(eventItem.id, token);
      } else {
        await joinEvent(eventItem.id, token);
      }

      await fetchEvents();
    } catch {
      setError('Could not update event participation.');
    } finally {
      setIsUpdatingEventId(null);
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
      const token = await getToken({ template: 'RollCallAuth' });
      await checkinService.startSession(selectedEvent.id, 'self', 15, token);
      setActiveSelfCheckinEventIds((prev) => (prev.includes(selectedEvent.id) ? prev : [...prev, selectedEvent.id]));
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
      const token = await getToken({ template: 'RollCallAuth' });
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
    const isSelfCheckinActive = activeSelfCheckinEventIds.includes(item.id);
    const isParticipantCheckedIn = checkedInEventIds.includes(item.id);
    const actionLabel = isOrganizer
      ? isSelfCheckinActive
        ? 'Check-in active'
        : 'Start check-in'
      : isUpdatingEventId === item.id
        ? 'Updating...'
        : getParticipantActionLabel(item);

    const actionVariant: 'start' | 'active' | 'checkedin' | 'join' | 'leave' | 'mandatory' | 'updating' = isOrganizer
      ? isSelfCheckinActive
        ? 'active'
        : 'start'
      : isUpdatingEventId === item.id
        ? 'updating'
        : isParticipantCheckedIn
          ? 'checkedin'
        : item.joinButtonState === 'leave'
          ? 'leave'
          : item.joinButtonState === 'mandatory'
            ? 'mandatory'
            : 'join';

    const actionDisabled = isOrganizer
      ? false
      : isUpdatingEventId !== null || item.joinButtonState === 'mandatory' || isParticipantCheckedIn;

    return (
      <EventCard
        event={item}
        onPress={() =>
          router.push({
            pathname: '/events/[id]',
            params: {
              id: String(item.id),
              returnTo: pathname,
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
          <AppButton
            variant="create"
            style={styles.createButtonTop}
            textStyle={styles.createButtonText}
            label="Create event +"
            onPress={() => router.push(`/events/create?tripId=${tripId}`)}
          />
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
                <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
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
});
