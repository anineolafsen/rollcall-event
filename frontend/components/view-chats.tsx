import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useFocusEffect } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
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
import { IconButton } from '@/components/ui/icon-button';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';
const CACHE_TTL = 60 * 1000; // Cache for 60 seconds
const REFRESH_DEBOUNCE = 2 * 1000; // Prevent refreshes within 2 seconds

interface Chat {
  id: number;
  tripId: number;
  title: string;
  creatorId: number;
  createdAt: string;
}

interface Trip {
  id: number;
  name: string;
}

interface ChatWithTrip {
  chat: Chat;
  trip: Trip | null;
}

type UserInfo = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

interface CacheData {
  data: ChatWithTrip[];
  timestamp: number;
}

export function ViewChatsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [chatsWithTrips, setChatsWithTrips] = useState<ChatWithTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [userCache, setUserCache] = useState<Record<number, UserInfo>>({});

  const cacheRef = useRef<CacheData | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const isCacheValid = (): boolean => {
    if (!cacheRef.current) return false;
    const age = Date.now() - cacheRef.current.timestamp;
    return age < CACHE_TTL;
  };

  const fetchCreatorUsers = useCallback(async (creatorIds: number[], token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const users: UserInfo[] = await response.json();
        const newCache: Record<number, UserInfo> = { ...userCache };
        creatorIds.forEach(id => {
          const user = users.find(u => u.id === id);
          if (user) {
            newCache[id] = user;
          }
        });
        setUserCache(newCache);
      }
    } catch (err) {
      console.error('Failed to fetch creator users:', err);
    }
  }, [userCache]);

  const showToast = (message: string) => {
    // Only show toast on native platforms, not web
    if (typeof ToastAndroid !== 'undefined' && ToastAndroid.show) {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  const fetchChats = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      
      console.log('🔄 fetchChats called with forceRefresh:', forceRefresh);
      
      // Check cache and debounce
      if (!forceRefresh && isCacheValid() && (now - lastRefreshRef.current) < REFRESH_DEBOUNCE) {
        console.log('⚡ Using cached data (debounced)');
        setChatsWithTrips(cacheRef.current!.data);
        showToast('Using cached data (updated 60s ago)');
        return;
      }

      // Use cache if valid and not force refreshing
      if (!forceRefresh && isCacheValid()) {
        console.log('⚡ Using valid cached data');
        setChatsWithTrips(cacheRef.current!.data);
        setLastUpdated(cacheRef.current!.timestamp);
        showToast('Using recent data');
        return;
      }

      console.log('🌐 Fetching fresh data from server...');

      setError(null);
      lastRefreshRef.current = now;

      // Get authentication token
      const token = await getTokenRef.current({ template: 'RollCallAuth' });
      console.log('🔐 Token acquired for API calls');

      // Fetch all trips first
      const tripsResponse = await fetch(`${API_BASE_URL}/api/trips/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const trips: Trip[] = tripsResponse.ok ? await tripsResponse.json() : [];
      console.log('✅ Fetched trips:', trips);

      // Fetch all chats in parallel instead of sequentially
      const allChats: ChatWithTrip[] = [];
      
      const chatPromises = trips.map(trip =>
        fetch(`${API_BASE_URL}/api/chats/trip/${trip.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(chatsResponse => chatsResponse.text())
          .then(chatsText => {
            console.log(`📌 Chats for trip ${trip.id} (${trip.name}):`, chatsText);
            const chats: Chat[] = chatsText ? JSON.parse(chatsText) : [];
            return chats.map(chat => ({ chat, trip }));
          })
          .catch(err => {
            console.error(`❌ Failed to fetch chats for trip ${trip.id}:`, err);
            return [];
          })
      );

      const chatResults = await Promise.all(chatPromises);
      chatResults.forEach(chats => allChats.push(...chats));

      console.log('📊 Total chats collected:', allChats.length);

      // Sort by creation date (newest first)
      allChats.sort((a, b) => {
        const dateA = new Date(a.chat.createdAt).getTime();
        const dateB = new Date(b.chat.createdAt).getTime();
        return dateB - dateA;
      });

      // Fetch creator user details
      const creatorIds = [...new Set(allChats.map(c => c.chat.creatorId))];
      await fetchCreatorUsers(creatorIds, token);

      // Cache the results
      cacheRef.current = {
        data: allChats,
        timestamp: now,
      };

      console.log('💾 Updated cache with', allChats.length, 'chats');
      console.log('📋 Chat list:', allChats.map(c => ({ id: c.chat.id, title: c.chat.title, trip: c.trip?.name })));

      setChatsWithTrips(allChats);
      setLastUpdated(now);
    } catch (err) {
      console.error('❌ Failed to fetch chats:', err);
      
      // If we have cached data, use it even if expired
      if (cacheRef.current) {
        setChatsWithTrips(cacheRef.current.data);
        setError('Network error. Showing cached data.');
        showToast('Network error. Showing cached data.');
      } else {
        setError('Could not load chats. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchCreatorUsers]);

  useEffect(() => {
    fetchChats(false);
  }, [fetchChats]);

  // Refetch chats when screen comes into focus (after creating a chat)
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Screen focused - checking if cache needs refresh');
      // Only force refresh if cache is expired, otherwise use cached data
      const now = Date.now();
      if (cacheRef.current && (now - cacheRef.current.timestamp) < CACHE_TTL) {
        console.log('⚡ Cache still valid, skipping refresh');
        return () => {};
      }
      console.log('🔄 Cache expired or missing, fetching fresh data');
      fetchChats(true); // Only force refresh if cache is stale
      return () => {}; // Cleanup function
    }, [fetchChats])
  );

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
    <TouchableOpacity onPress={() => router.push(`/(app)/(tabs)/chats/${item.chat.id}` as any)}>
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
            {userCache[item.chat.creatorId] ? (
              `Created by ${userCache[item.chat.creatorId].firstName || ''} ${userCache[item.chat.creatorId].lastName || ''}`.trim()
            ) : (
              `Created by User ${item.chat.creatorId}`
            )}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Chats</Text>
            <IconButton
              accessibilityLabel="Create new chat"
              onPress={() => router.push('/(app)/(tabs)/chats/create' as any)}
              renderIcon={(color) => <Plus size={20} color={color} />}
              size={40}
              style={styles.createChatButton}
            />
          </View>
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
            keyExtractor={(item) => item.chat.id.toString()}
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
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  header: {
    marginBottom: 4,
  },
  titleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#090909',
    textAlign: 'center',
  },
  createChatButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#7a9bb5',
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 6,
  },
  titleDivider: {
    height: 3,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 28,
    marginHorizontal: 28,
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
});
