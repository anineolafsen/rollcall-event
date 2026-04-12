import React, { useCallback, useState } from 'react';
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
} from 'react-native';

import { AppButton } from '@/components/ui/button';
import { formatEventDate, formatEventTime, getUpcomingEvents } from '@/lib/event-format';
import { getEvents, type EventRecord } from '@/lib/events';

export function UpcomingEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const data = await getEvents();
      setEvents(getUpcomingEvents(data));
    } catch {
      setError('Could not load events. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const renderEvent = ({ item }: { item: EventRecord }) => (
    <TouchableOpacity onPress={() => router.push(`/events/${item.eventID}`)}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.eventName}>{item.name}</Text>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date:</Text>
            <Text style={styles.metaValue}>{formatEventDate(item.startDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Time:</Text>
            <Text style={styles.metaValue}>{formatEventTime(item.startDate)}</Text>
          </View>
        </View>

        {item.location ? <Text style={styles.location}>{item.location}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Upcoming Events</Text>
        <View style={styles.titleDivider} />

        <AppButton
          variant="create"
          style={styles.createButtonTop}
          textStyle={styles.createButtonText}
          label="Create new event +"
          onPress={() => router.push('/events/create')}
        />

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
                keyExtractor={(item) => item.eventID.toString()}
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
  title: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '900',
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
    minWidth: 290,
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
  card: {
    backgroundColor: '#c7e2f8',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 4,
    borderColor: '#75baf0',
  },
  cardHeader: {
    marginBottom: 8,
  },
  eventName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    color: '#090909',
  },
  cardDivider: {
    height: 4,
    width: '72%',
    backgroundColor: '#3b3b3b',
    marginBottom: 18,
  },
  metaBlock: {
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metaLabel: {
    fontSize: 18,
    lineHeight: 24,
    color: '#6e7c89',
    marginRight: 6,
  },
  metaValue: {
    fontSize: 18,
    lineHeight: 24,
    color: '#6e7c89',
  },
  location: {
    marginTop: 14,
    fontSize: 14,
    color: '#31597c',
    fontWeight: '600',
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
  createButtonText: {},
});
