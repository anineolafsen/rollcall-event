import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from "@clerk/expo";
import { Plus } from 'lucide-react-native';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useMobileTripStore, type MobileTrip } from '@/lib/mobile-trip-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export function ViewTripsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { width } = useWindowDimensions();
  const setSelectedTrip = useMobileTripStore((state) => state.setSelectedTrip);
  const cachedTrips = useMobileTripStore((state) => state.trips);
  const tripsLoaded = useMobileTripStore((state) => state.tripsLoaded);
  const setTripsCache = useMobileTripStore((state) => state.setTrips);
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;

  const [trips, setTrips] = useState<MobileTrip[]>(cachedTrips);
  const [loading, setLoading] = useState(!tripsLoaded);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTrips(cachedTrips);
    if (cachedTrips.length > 0 || tripsLoaded) {
      setLoading(false);
    }
  }, [cachedTrips, tripsLoaded]);

  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken({ template: "RollCallAuth" });
      const response = await fetch(`${API_BASE_URL}/api/trips/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data: MobileTrip[] = await response.json();
      const sortedTrips = [...data].sort((a, b) => {
        const aTime = new Date(a.startDate).getTime();
        const bTime = new Date(b.startDate).getTime();

        if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
          return 0;
        }
        if (Number.isNaN(aTime)) {
          return 1;
        }
        if (Number.isNaN(bTime)) {
          return -1;
        }

        return aTime - bTime;
      });
      setTrips(sortedTrips);
      setTripsCache(data);
    } catch {
      setError('Could not load trips. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, setTripsCache]); // getToken is stable

  useEffect(() => {
    if (!tripsLoaded) {
      void fetchTrips();
    }
  }, [fetchTrips, tripsLoaded]);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchTrips();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderTrip = ({ item }: { item: MobileTrip }) => (
    <Pressable
      onPress={() => {
        setSelectedTrip({ id: item.id, name: item.name, isOrganizer: Boolean(item.isOrganizer) });
        if (isDesktopWeb) {
          router.push(`/trips/${item.id}`);
          return;
        }

        router.push('/');
      }}
      style={({ hovered, pressed }) => [
        styles.card,
        isDesktopWeb && hovered && styles.cardHovered,
        pressed && styles.cardPressed,
      ]}>
      <View style={styles.cardHeader}>
        <Text style={styles.tripName}>{item.name}</Text>
        {item.destination && (
          <Text style={styles.destination}>{item.destination}</Text>
        )}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>From</Text>
          <Text style={styles.dateValue}>{item.startDate ? formatDate(item.startDate) : '-'}</Text>
        </View>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>To</Text>
          <Text style={styles.dateValue}>{item.endDate ? formatDate(item.endDate) : '-'}</Text>
        </View>
      </View>
      {isDesktopWeb && item.description ? (
        <Text style={styles.description}>{item.description}</Text>
      ) : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>My Trips</Text>
          <Pressable
            onPress={() => router.push('/trips/create')}
            style={({ pressed, hovered }) => [
              styles.iconButton,
              styles.rightIconButton,
              hovered && styles.createButtonHovered,
              pressed && styles.iconButtonPressed,
            ]}>
            {({ hovered }) => (
            <Plus size={20} color={hovered ? '#ffffff' : '#4a7ca8'} />
            )}
          </Pressable>
        </View>
        <View style={styles.titleDivider} />

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#76b6ee" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTrips}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No trips found.</Text>
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTrip}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingTop: 64,
    paddingBottom: 2,
    
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
  listContent: {
    paddingBottom: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#d0e5f7',
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardHeader: {
    backgroundColor: '#4a7ca8', 
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  tripName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
  },
  destination: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  dateBlock: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#d0e5f7',
    paddingLeft: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#7a9ab8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a3d5c',
  },
  description: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    fontSize: 13,
    color: '#5a7a94',
    lineHeight: 19,
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
  iconButton: {
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
  leftIconButton: {
    position: 'absolute',
    left: 0,
    zIndex: 2,
  },
  rightIconButton: {
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconButtonPressed: {
    opacity: 0.8,
  },
  separator: {
    height: 1,
    backgroundColor: '#d0e5f7',
    marginVertical: 8,
    marginHorizontal: 4,
    opacity: 1,
  },
  createButtonHovered: {
    backgroundColor: '#4a7ca8',
    borderColor: '#4a7ca8',
  },
  cardHovered: {
    borderColor: '#4a7ca8',
  },
});
