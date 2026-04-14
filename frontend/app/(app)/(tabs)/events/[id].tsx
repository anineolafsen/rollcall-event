import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { AppButton } from '@/components/ui/button';
import { formatAttendanceMode, formatEventDate, formatEventTime } from '@/lib/event-format';
import { deleteEvent as deleteEventRequest, getEventById, type EventRecord } from '@/lib/events';

export default function EventDetailsScreen() {
  const { id, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventById(String(id));
        setEvent(data);
      } catch {
        setError('Could not load event details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  const handleGoBack = () => {
    if (returnTo) {
      router.replace(returnTo);
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
      await deleteEventRequest(String(id));
      router.replace(`/trips/${event.tripID}`);
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
    flex: 1,
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
});
