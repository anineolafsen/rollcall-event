import React, { useCallback, useState } from 'react';
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
import { useAuth } from "@clerk/expo";

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

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingEventId, setIsUpdatingEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [checkinMethodModalVisible, setCheckinMethodModalVisible] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken({ template: "RollCallAuth" });
      const data = await getEvents(tripId, token);
      setEvents(getUpcomingEvents(data));
    } catch {
      setError('Could not load events for this trip.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]); // getToken is stable

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

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
    if (eventItem.joinButtonState === 'leave') {
      return 'Leave';
    }

    if (eventItem.joinButtonState === 'mandatory') {
      return 'Mandatory';
    }

    return 'Join';
  };

  const renderEvent = ({ item }: { item: EventRecord }) => {
    const actionLabel = isOrganizer
      ? 'Start check-in'
      : isUpdatingEventId === item.id
        ? 'Updating...'
        : getParticipantActionLabel(item);

    const actionVariant: 'start' | 'join' | 'leave' | 'mandatory' | 'updating' = isOrganizer
      ? 'start'
      : isUpdatingEventId === item.id
        ? 'updating'
        : item.joinButtonState === 'leave'
          ? 'leave'
          : item.joinButtonState === 'mandatory'
            ? 'mandatory'
            : 'join';

    const actionDisabled = isOrganizer
      ? false
      : isUpdatingEventId !== null || item.joinButtonState === 'mandatory';

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
