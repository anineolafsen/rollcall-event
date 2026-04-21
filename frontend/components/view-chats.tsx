import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ToastAndroid,
} from 'react-native';
import { AppButton } from '@/components/ui/button';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';
const CACHE_TTL = 60 * 1000; // Cache for 60 seconds
const REFRESH_DEBOUNCE = 2 * 1000; // Prevent refreshes within 2 seconds

interface Chat {
  chatID: number;
  tripID: number;
  title: string;
  creatorID: string;
  createdAt: string;
}

interface Trip {
  tripID: number;
  name: string;
}

interface ChatWithTrip {
  chat: Chat;
  trip: Trip | null;
}

interface CacheData {
  data: ChatWithTrip[];
  timestamp: number;
}

export function ViewChatsScreen() {
  const router = useRouter();
  const [chatsWithTrips, setChatsWithTrips] = useState<ChatWithTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const cacheRef = useRef<CacheData | null>(null);
  const lastRefreshRef = useRef<number>(0);

  const isCacheValid = (): boolean => {
    if (!cacheRef.current) return false;
    const age = Date.now() - cacheRef.current.timestamp;
    return age < CACHE_TTL;
  };

  const fetchChats = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      
      // Check cache and debounce
      if (!forceRefresh && isCacheValid() && (now - lastRefreshRef.current) < REFRESH_DEBOUNCE) {
        // Use cache - show toast to user
        setChatsWithTrips(cacheRef.current!.data);
        ToastAndroid.show('Using cached data (updated 60s ago)', ToastAndroid.SHORT);
        return;
      }

      // Use cache if valid and not force refreshing
      if (!forceRefresh && isCacheValid()) {
        setChatsWithTrips(cacheRef.current!.data);
        setLastUpdated(cacheRef.current!.timestamp);
        ToastAndroid.show('Using recent data', ToastAndroid.SHORT);
        return;
      }

      setError(null);
      lastRefreshRef.current = now;

      // Fetch all trips first
      const tripsResponse = await fetch(`${API_BASE_URL}/api/trips`);
      const trips: Trip[] = tripsResponse.ok ? await tripsResponse.json() : [];

      // For each trip, fetch its chats
      const allChats: ChatWithTrip[] = [];

      for (const trip of trips) {
        try {
          const chatsResponse = await fetch(`${API_BASE_URL}/api/chats/trip/${trip.tripID}`);
          const chats: Chat[] = chatsResponse.ok ? await chatsResponse.json() : [];

          chats.forEach((chat) => {
            allChats.push({
              chat,
              trip,
            });
          });
        } catch (err) {
          console.error(`Failed to fetch chats for trip ${trip.tripID}:`, err);
        }
      }

      // Sort by creation date (newest first)
      allChats.sort((a, b) => {
        const dateA = new Date(a.chat.createdAt).getTime();
        const dateB = new Date(b.chat.createdAt).getTime();
        return dateB - dateA;
      });

      // Cache the results
      cacheRef.current = {
        data: allChats,
        timestamp: now,
      };

      setChatsWithTrips(allChats);
      setLastUpdated(now);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
      
      // If we have cached data, use it even if expired
      if (cacheRef.current) {
        setChatsWithTrips(cacheRef.current.data);
        setError('Network error. Showing cached data.');
        ToastAndroid.show('Network error. Showing cached data.', ToastAndroid.LONG);
      } else {
        setError('Could not load chats. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChats(false);
  }, [fetchChats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }

      if (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
      ) {
        return 'Yesterday';
      }

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const formatLastUpdated = (): string => {
    if (!lastUpdated) return 'Never';
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const renderChat = ({ item }: { item: ChatWithTrip }) => (
    <TouchableOpacity onPress={() => router.push(`/(app)/(tabs)/chats/${item.chat.chatID}` as any)}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.chatInfo}>
            <Text style={styles.chatTitle}>{item.chat.title}</Text>
            {item.trip && (
              <Text style={styles.tripName}>
                📌 {item.trip.name}
              </Text>
            )}
          </View>
          <Text style={styles.timestamp}>{formatDate(item.chat.createdAt)}</Text>
        </View>

        <View style={styles.cardMeta}>
          <Text style={styles.createdBy}>
            Created by {item.chat.creatorID.split('@')[0]}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.lastUpdatedText}>Updated: {formatLastUpdated()}</Text>
        </View>
        <View style={styles.titleDivider} />

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#76b6ee" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchChats(true)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : chatsWithTrips.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No chats yet.</Text>
            <Text style={styles.emptySubText}>
              Create a chat from a trip to get started.
            </Text>
          </View>
        ) : (
          <FlatList
            data={chatsWithTrips}
            keyExtractor={(item) => item.chat.chatID.toString()}
            renderItem={renderChat}
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

        <AppButton
          variant="create"
          style={styles.createButton}
          label="Create new chat +"
          onPress={() => router.push('/(app)/(tabs)/chats/create' as any)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#090909',
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#7a9bb5',
    fontWeight: '500',
  },
  titleDivider: {
    height: 1,
    backgroundColor: '#d9e8f5',
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7a9bb5',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#7a9bb5',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4a7ca8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e8f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chatInfo: {
    flex: 1,
    marginRight: 8,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#090909',
    marginBottom: 4,
  },
  tripName: {
    fontSize: 13,
    color: '#4a7ca8',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#7a9bb5',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createdBy: {
    fontSize: 12,
    color: '#7a9bb5',
  },
  createButton: {
    marginTop: 'auto',
    marginBottom: 16,
  },
});
