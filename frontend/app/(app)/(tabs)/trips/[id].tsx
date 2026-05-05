import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '@clerk/expo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { TripActionButton } from '@/components/ui/trip-action-button';
import { useMobileTripStore } from '@/lib/mobile-trip-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

interface Trip {
  id: number;
  name: string;
  isOrganizer: boolean;
  startDate?: string | null;
  endDate?: string | null;
  destination?: string | null;
  description?: string | null;
  organizerPhone?: string | null;
}

export default function TripHomeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  const setSelectedTrip = useMobileTripStore((state) => state.setSelectedTrip);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formatDateValue = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const token = await getToken({ template: 'RollCallAuth' });
        const response = await fetch(`${API_BASE_URL}/api/trips/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const data: Trip = await response.json();
        setTrip(data);
        setSelectedTrip({ id: data.id, name: data.name, isOrganizer: data.isOrganizer });
      } catch {
        setError('Could not load trip details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) void fetchTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, setSelectedTrip]);

  const handleDeleteTrip = () => {
    if (Platform.OS === 'web') {
      if (!window.confirm(`Are you sure you want to delete "${trip?.name}"? This will permanently remove the trip, all participants, and all associated data.`)) return;
      void performDelete();
    } else {
      Alert.alert(
        'Delete Trip',
        `Are you sure you want to delete "${trip?.name}"? This will permanently remove the trip, all participants, and all associated data.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => void performDelete() },
        ]
      );
    }
  };

  const performDelete = async () => {
    setDeleting(true);
    try {
      const token = await getToken({ template: 'RollCallAuth' });
      const response = await fetch(`${API_BASE_URL}/api/trips/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      router.replace('/trips');
    } catch {
      if (Platform.OS === 'web') {
        window.alert('Could not delete the trip. Please try again.');
      } else {
        Alert.alert('Error', 'Could not delete the trip. Please try again.');
      }
      setDeleting(false);
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

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.screen}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/trips')}>
            <Text style={styles.backButtonText}>← Go back</Text>
          </TouchableOpacity>
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error || 'Trip not found'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Mobile: standalone info card, no events list ──────────────────────────
  if (!isDesktopWeb) {
    const formattedStart = formatDateValue(trip.startDate);
    const formattedEnd = formatDateValue(trip.endDate);
    const mobileDateText =
      formattedStart && formattedEnd
        ? `${formattedStart} – ${formattedEnd}`
        : 'Not added';

    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.mobileContent}>
          <TouchableOpacity style={styles.mobileBackButton} onPress={() => router.replace('/trips')}>
            <MaterialIcons name="arrow-back" size={22} color="#1a3d5c" />
          </TouchableOpacity>

          <Text style={styles.mobileTripName}>{trip.name}</Text>
          <View style={styles.mobileTitleDivider} />

          {trip.isOrganizer ? (
            <View style={styles.mobileActionsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mobileButtonsScroll}
                style={styles.mobileButtonsScrollView}
              >
                <TripActionButton
                  label="+ Manage Invitations"
                  onPress={() =>
                    router.push({
                      pathname: '/trips/[id]/manage-invitations',
                      params: { id: String(trip.id), tripId: trip.id, tripName: trip.name },
                    })
                  }
                />
                <TripActionButton
                  label="View Needs"
                  backgroundColor="#d9e8f5"
                  textColor="#1a3d5c"
                  onPress={() =>
                    router.push({
                      pathname: '/trips/[id]/participant-needs',
                      params: { id: String(trip.id), tripName: trip.name },
                    })
                  }
                />
                <TripActionButton
                  label="✎ Edit"
                  backgroundColor="#76b6ee"
                  onPress={() =>
                    router.push({
                      pathname: '/trips/create',
                      params: { id: trip.id },
                    })
                  }
                />
                <TripActionButton
                  label="+ Add Organizer"
                  backgroundColor="#fbbf24"
                  textColor="#1a3d5c"
                  onPress={() =>
                    router.push({
                      pathname: '/trips/[id]/organizers',
                      params: { id: String(trip.id), tripName: trip.name },
                    })
                  }
                />
              </ScrollView>
              <View style={styles.scrollIndicator} pointerEvents="none">
                <MaterialIcons name="chevron-right" size={16} color="#4a7ca8" />
              </View>
            </View>
          ) : null}

          <View style={styles.mobileInfoCard}>
            {trip.destination?.trim() ? (
              <View style={styles.mobileInfoRow}>
                <MaterialIcons name="place" size={15} color="#7a9ab8" />
                <Text style={styles.mobileInfoText}>{trip.destination}</Text>
              </View>
            ) : null}
            <View style={styles.mobileInfoRow}>
              <MaterialIcons name="calendar-today" size={15} color="#7a9ab8" />
              <Text style={styles.mobileInfoText}>{mobileDateText}</Text>
            </View>
            {trip.organizerPhone?.trim() ? (
              <View style={styles.mobileInfoRow}>
                <MaterialIcons name="phone" size={15} color="#7a9ab8" />
                <Text style={styles.mobileInfoText}>{trip.organizerPhone}</Text>
              </View>
            ) : null}
            {trip.description?.trim() ? (
              <Text style={styles.mobileDescription}>{trip.description}</Text>
            ) : null}
          </View>

          {trip.isOrganizer ? (
            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
              onPress={handleDeleteTrip}
              disabled={deleting}
            >
              <Text style={styles.deleteButtonText}>
                {deleting ? 'Deleting…' : 'Delete Trip'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Desktop: overview card with full details ──────────────────────────────
  const formattedStartDate = formatDateValue(trip.startDate);
  const formattedEndDate = formatDateValue(trip.endDate);
  const dateRangeText =
    formattedStartDate && formattedEndDate
      ? `${formattedStartDate} - ${formattedEndDate}`
      : 'Not added';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/trips')}>
          <Text style={styles.backButtonText}>← Go back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{trip.name}</Text>
        <View style={styles.titleDivider} />

        <View style={styles.buttonRow}>
          {trip.isOrganizer ? (
            <>
              <TripActionButton
                label="+ Manage Invitations"
                onPress={() =>
                  router.push({
                    pathname: '/trips/[id]/manage-invitations',
                    params: { id: String(trip.id), tripId: trip.id, tripName: trip.name },
                  })
                }
              />
              <TripActionButton
                label="View Needs"
                backgroundColor="#d9e8f5"
                textColor="#1a3d5c"
                onPress={() =>
                  router.push({
                    pathname: '/trips/[id]/participant-needs',
                    params: { id: String(trip.id), tripName: trip.name },
                  })
                }
              />
              <TripActionButton
                label="✎ Edit"
                backgroundColor="#76b6ee"
                onPress={() =>
                  router.push({
                    pathname: '/trips/create',
                    params: { id: trip.id },
                  })
                }
              />
            </>
          ) : null}
          <TripActionButton
            label="See Events"
            backgroundColor="#4a7ca8"
            textColor="#fff"
            onPress={() =>
              router.push({
                pathname: '/trips/[id]/events',
                params: { id: String(trip.id), tripName: trip.name },
              })
            }
          />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.overviewCard}>
          <View style={styles.topInfoRow}>
            <View style={styles.leftInfoGroup}>
              <View>
                <Text style={styles.infoLabel}>Location</Text>
                <View style={styles.locationPill}>
                  <Text style={styles.locationPillText}>
                    {trip.destination?.trim() ? trip.destination : 'Not added'}
                  </Text>
                </View>
              </View>

              <View>
                <Text style={styles.infoLabel}>Date</Text>
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>{dateRangeText}</Text>
                </View>
              </View>
            </View>

            <View style={styles.organizerInlineSection}>
              {trip.isOrganizer ? (
                <View style={styles.organizerActionSection}>
                  <TripActionButton
                    label="+ Add Organizer"
                    backgroundColor="#fbbf24"
                    textColor="#1a3d5c"
                    onPress={() =>
                      router.push({
                        pathname: '/trips/[id]/organizers',
                        params: { id: String(trip.id), tripName: trip.name },
                      })
                    }
                  />
                </View>
              ) : null}
              <Text style={styles.infoLabel}>Organizer phone</Text>
              <Text style={styles.organizerPhoneValue}>
                {trip.organizerPhone?.trim() ? trip.organizerPhone : 'Not added'}
              </Text>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>
              {trip.description?.trim() ? trip.description : 'Not added'}
            </Text>
          </View>
        </View>

        {trip.isOrganizer && (
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteTrip}
            disabled={deleting}
          >
            <Text style={styles.deleteButtonText}>
              {deleting ? 'Deleting…' : 'Delete Trip'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },

  // ── Mobile styles ──────────────────────────────────────────────────────────
  mobileContent: {
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 100,
    gap: 16,
  },
  mobileBackButton: {
    alignSelf: 'flex-start',
    padding: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#d9e8f5',
    shadowColor: '#0b2540',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  mobileTripName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#090909',
    lineHeight: 32,
    textAlign: 'center',
  },
  mobileTitleDivider: {
    height: 3,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
    marginHorizontal: 28,
  },
  mobileInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d0e5f7',
    padding: 16,
    gap: 10,
  },
  mobileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileInfoText: {
    fontSize: 15,
    color: '#1a3d5c',
    fontWeight: '500',
    flexShrink: 1,
  },
  mobileDescription: {
    fontSize: 14,
    color: '#1a3d5c',
    lineHeight: 21,
    marginTop: 4,
  },
  mobileActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  mobileButtonsScrollView: {
    flex: 1,
  },
  scrollIndicator: {
    position: 'absolute',
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#eef5fb',
    borderWidth: 1,
    borderColor: '#d0e5f7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0b2540',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  mobileButtonsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 36,
  },

  // ── Desktop styles ─────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#eef5fb',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
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
    textAlign: 'center',
    color: '#090909',
  },
  titleDivider: {
    height: 3,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 12,
    marginHorizontal: 28,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d0e5f7',
    padding: 18,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  leftInfoGroup: {
    flexDirection: 'column',
    gap: 12,
    flexShrink: 1,
  },
  locationPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  locationPillText: {
    fontSize: 15,
    color: '#164a75',
    fontWeight: '700',
  },
  datePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  datePillText: {
    fontSize: 15,
    color: '#2a4a68',
    fontWeight: '700',
  },
  organizerInlineSection: {
    alignItems: 'flex-end',
    marginLeft: 10,
    maxWidth: '38%',
  },
  organizerActionSection: {
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  organizerPhoneValue: {
    fontSize: 16,
    color: '#1a3d5c',
    fontWeight: '600',
    textAlign: 'right',
  },
  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: '#e4eef8',
    paddingTop: 14,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7a9ab8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1a3d5c',
    fontWeight: '500',
  },

  // ── Shared ─────────────────────────────────────────────────────────────────
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
  deleteButton: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8b4b4',
    backgroundColor: '#fdf0f0',
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#b0413e',
  },
});
