import { useAuth } from '@clerk/expo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  type ScrollView as ScrollViewType,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import ParticipantNeedsScreen from '@/app/(app)/(tabs)/trips/[id]/participant-needs';
import InvitationsView from '@/components/invitationsView';
import TripDescriptionEditor from '@/components/trip-description-editor';
import { useMobileTripStore, type MobileTrip } from '@/lib/mobile-trip-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function Home() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { width } = useWindowDimensions();
  const mobileTabScrollRef = useRef<ScrollViewType | null>(null);
  const mobileTabScrollXRef = useRef(0);
  const selectedTripId = useMobileTripStore((state) => state.selectedTripId);
  const selectedTripName = useMobileTripStore((state) => state.selectedTripName);
  const cachedTrips = useMobileTripStore((state) => state.trips);
  const tripsLoaded = useMobileTripStore((state) => state.tripsLoaded);
  const setTripsCache = useMobileTripStore((state) => state.setTrips);
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  const showMobileHeaderDivider = !isDesktopWeb;
  const showMobileOrganizerTabs = !isDesktopWeb;

  const [trips, setTrips] = useState<MobileTrip[]>(cachedTrips);
  const [loading, setLoading] = useState(!tripsLoaded);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState(0);

  useEffect(() => {
    setTrips(cachedTrips);
    if (cachedTrips.length > 0 || tripsLoaded) {
      setLoading(false);
    }
  }, [cachedTrips, tripsLoaded]);

  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken({ template: 'RollCallAuth' });
      const response = await fetch(`${API_BASE_URL}/api/trips/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data: MobileTrip[] = await response.json();
      setTrips(data);
      setTripsCache(data);
    } catch {
      setError('Could not load trip information.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, setTripsCache]);

  useEffect(() => {
    if (!tripsLoaded) {
      void fetchTrips();
    }
  }, [fetchTrips, tripsLoaded]);

  const activeTrip = useMemo(() => {
    if (trips.length === 0) {
      return null;
    }

    if (selectedTripId == null) {
      return trips[0];
    }

    return trips.find((trip) => trip.id === selectedTripId) ?? null;
  }, [selectedTripId, trips]);

  const organizerTabs = useMemo(() => {
    if (!activeTrip) {
      return [];
    }

    return [
      {
        key: 'info',
        label: 'Info',
        render: () => (
          <View style={styles.card}>
            <Text style={styles.description}>
              {activeTrip.description?.trim() || 'No trip description added yet.'}
            </Text>
          </View>
        ),
      },
      {
        key: 'manage',
        label: 'Manage invitations',
        render: () => (
          <InvitationsView
            embedded
            tripId={activeTrip.id}
            tripName={activeTrip.name}
          />
        ),
      },
      {
        key: 'needs',
        label: 'View needs',
        render: () => (
          <ParticipantNeedsScreen
            embedded
            tripId={activeTrip.id}
            tripName={activeTrip.name}
          />
        ),
      },
      {
        key: 'edit',
        label: 'Edit',
        render: () => (
          <TripDescriptionEditor
            trip={{
              id: activeTrip.id,
              name: activeTrip.name,
              destination: activeTrip.destination ?? '',
              startDate: activeTrip.startDate,
              endDate: activeTrip.endDate,
              description: activeTrip.description ?? '',
            }}
            onSaved={(description) => {
              setTrips((currentTrips) => currentTrips.map((trip) => (
                trip.id === activeTrip.id
                  ? {
                      ...trip,
                      description,
                    }
                  : trip
              )));
            }}
          />
        ),
      },
    ];
  }, [activeTrip]);

  const handleMobileTabHintPress = useCallback(() => {
    const nextOffset = mobileTabScrollXRef.current + 120;
    mobileTabScrollRef.current?.scrollTo({ x: nextOffset, animated: true });
    mobileTabScrollXRef.current = nextOffset;
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void fetchTrips();
            }}
            tintColor="#76b6ee"
          />
        }
        >
        <View style={styles.mainContent}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {activeTrip?.name ?? selectedTripName ?? 'Trip description'}
            </Text>
            {showMobileHeaderDivider ? <View style={styles.titleDivider} /> : null}
          </View>

          {loading && !refreshing ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#76b6ee" />
            </View>
          ) : error ? (
            <Text style={styles.feedbackText}>{error}</Text>
          ) : !activeTrip ? (
            <Text style={styles.feedbackText}>No trips found yet.</Text>
          ) : (
            <>
              {activeTrip.isOrganizer && showMobileOrganizerTabs ? (
                <View style={styles.mobileTabsSection}>
                  <View style={styles.mobileTabScroller}>
                    <ScrollView
                      ref={mobileTabScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.mobileTabList}
                      style={styles.mobileTabScroll}
                      onScroll={(event) => {
                        mobileTabScrollXRef.current = event.nativeEvent.contentOffset.x;
                      }}
                      scrollEventThrottle={16}
                      >
                        {organizerTabs.map((tab, index) => {
                          const isActive = index === activeMobileTab;

                        return (
                          <Pressable
                            key={tab.key}
                            style={[styles.mobileTab, isActive && styles.mobileTabActive]}
                            onPress={() => setActiveMobileTab(index)}
                          >
                            <Text style={[styles.mobileTabText, isActive && styles.mobileTabTextActive]}>
                              {tab.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                    <Pressable
                      onPress={handleMobileTabHintPress}
                      style={styles.mobileTabHintBadge}
                      hitSlop={8}
                    >
                      <MaterialIcons name="chevron-right" size={18} color="#4a7ca8" />
                    </Pressable>
                  </View>

                  <View style={styles.mobileActivePanel}>
                    {organizerTabs[activeMobileTab]?.render()}
                  </View>
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.description}>
                    {activeTrip.description?.trim() || 'No trip description added yet.'}
                  </Text>
                </View>
              )}
              {activeTrip.isOrganizer && !showMobileOrganizerTabs ? (
                <View style={styles.buttonRow}>
                  <Pressable
                    style={styles.inviteButton}
                    onPress={() =>
                      router.push({
                        pathname: '/trips/[id]/manage-invitations',
                        params: {
                          id: String(activeTrip.id),
                          tripId: activeTrip.id,
                          tripName: activeTrip.name,
                        },
                      })
                    }
                  >
                    <Text style={styles.inviteButtonText}>+ Manage Invitations</Text>
                  </Pressable>
                  <Pressable
                    style={styles.needsButton}
                    onPress={() =>
                      router.push({
                        pathname: '/trips/[id]/participant-needs',
                        params: { id: String(activeTrip.id), tripName: activeTrip.name },
                      })
                    }
                  >
                    <Text style={styles.needsButtonText}>View Needs</Text>
                  </Pressable>
                  <Pressable
                    style={styles.editButton}
                    onPress={() =>
                      router.push({
                        pathname: '/trips/create',
                        params: { id: activeTrip.id },
                      })
                    }
                  >
                    <Text style={styles.editButtonText}>✎ Edit</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
      {isDesktopWeb ? (
        <Pressable style={styles.switchButton} onPress={() => router.push('/trips')}>
          <MaterialIcons name="swap-horiz" size={20} color="#ffffff" />
          <Text style={styles.switchButtonText}>Switch trip</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 128,
  },
  mainContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#090909',
    textAlign: 'center',
  },
  titleDivider: {
    height: 3,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 28,
    marginHorizontal: 28,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 24,
  },
  inviteButton: {
    backgroundColor: '#4a7ca8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  inviteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  needsButton: {
    backgroundColor: '#d9e8f5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  needsButtonText: {
    color: '#1a3d5c',
    fontWeight: '600',
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#76b6ee',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  switchButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 88,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4a7ca8',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  switchButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#d9e8f5',
  },
  description: {
    fontSize: 17,
    lineHeight: 28,
    color: '#1a3d5c',
  },
  mobileTabsSection: {
    gap: 16,
  },
  mobileTabScroller: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileTabScroll: {
    flex: 1,
    overflow: 'visible',
  },
  mobileTabList: {
    gap: 10,
    paddingLeft: 4,
    paddingRight: 4,
  },
  mobileTab: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#dfeaf5',
  },
  mobileTabActive: {
    backgroundColor: '#76b6ee',
  },
  mobileTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4d647b',
  },
  mobileTabTextActive: {
    color: '#ffffff',
  },
  mobileTabHintBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#f6fbff',
    borderWidth: 1,
    borderColor: '#c7dcef',
    shadowColor: '#76b6ee',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },
  mobileActivePanel: {
    minHeight: 0,
  },
  mobilePanelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#d9e8f5',
    minHeight: 180,
    justifyContent: 'space-between',
    gap: 14,
  },
  mobilePanelTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#090909',
  },
  mobilePanelText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#5d7288',
  },
  mobilePanelPrimaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#4a7ca8',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  mobilePanelPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  mobilePanelSecondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#d9e8f5',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  mobilePanelAccentButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#76b6ee',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  mobilePanelSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a3d5c',
  },
  mobilePanelAccentButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  feedbackText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#5d7288',
  },
});
