import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth, useClerk } from "@clerk/expo";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Plus } from 'lucide-react-native';

import {
  Alert,
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
import { useMobileTripStore } from '@/lib/mobile-trip-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface Trip {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isOrganizer?: boolean;
  destination?: string;
  description?: string;
}

export function ViewTripsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { width } = useWindowDimensions();
  const setSelectedTrip = useMobileTripStore((state) => state.setSelectedTrip);
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const fetchTrips = useCallback(async () => {
    if (isSigningOut) {
      return;
    }

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
      const data: Trip[] = await response.json();
      setTrips(data);
    } catch {
      setError('Could not load trips. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, isSigningOut]); // getToken is stable

  useEffect(() => {
    void fetchTrips();
  }, [fetchTrips]);

  const onRefresh = () => {
    if (isSigningOut) {
      return;
    }

    setRefreshing(true);
    void fetchTrips();
  };

  const performSignOut = useCallback(async () => {
    setIsSigningOut(true);
    setSelectedTrip({ id: null });
    await signOut();
  }, [setSelectedTrip, signOut]);

  const handleSignOut = useCallback(() => {
    if (Platform.OS === 'web') {
      void performSignOut();
      return;
    }

    Alert.alert('Sign out', 'Do you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await performSignOut();
        },
      },
    ]);
  }, [performSignOut]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <Pressable
      onPress={() => {
        setSelectedTrip({ id: item.id, isOrganizer: Boolean(item.isOrganizer) });
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
      {item.description ? (
        <Text style={styles.description}>{item.description}</Text>
      ) : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          {!isDesktopWeb ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              onPress={handleSignOut}
              disabled={isSigningOut}
              style={({ pressed, hovered }) => [
                styles.iconButton,
                styles.leftIconButton,
                hovered && styles.createButtonHovered,
                isSigningOut && styles.iconButtonDisabled,
                pressed && styles.iconButtonPressed,
              ]}
            >
              {({ hovered }) => (
                <MaterialIcons name="logout" size={20} color={hovered ? '#ffffff' : '#4a7ca8'} />
              )}
            </Pressable>
          ) : null}
          <Text style={styles.title}>My Trips</Text>
          <Pressable
            onPress={() => router.push('/trips/create')}
            disabled={isSigningOut}
            style={({ pressed, hovered }) => [
              styles.iconButton,
              styles.rightIconButton,
              hovered && styles.createButtonHovered,
              isSigningOut && styles.iconButtonDisabled,
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
      {isSigningOut ? (
        <View style={styles.signOutOverlay}>
          <ActivityIndicator size="large" color="#4a7ca8" />
        </View>
      ) : null}
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
    paddingTop: 40,
    paddingBottom: 2,
    
  },
  title: {
    fontSize: 34,
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
  iconButtonDisabled: {
    opacity: 0.55,
  },
  signOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(238, 245, 251, 0.6)',
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
