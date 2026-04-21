import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { AppButton } from '@/components/ui/button';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface Trip {
  tripID: number;
  name: string;
  startDate: string;
  endDate: string;
  destination?: string;
  description?: string;
}

export function ViewTripsScreen() {
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/trips`);
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
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <TouchableOpacity onPress={() => router.push(`/trips/${item.tripID}`)}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.tripName}>{item.name}</Text>
          {item.destination && (
            <Text style={styles.destination}>{item.destination}</Text>
          )}
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.dateRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>From</Text>
            <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
          </View>
          <View style={styles.dateSeparator} />
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>To</Text>
            <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.description}>{item.description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>My Trips</Text>
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
            keyExtractor={(item) => item.tripID.toString()}
            renderItem={renderTrip}
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
          label="Create new trip +"
          onPress={() => router.push('/trips/create')}
        />
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
    paddingTop: 80,
    paddingBottom: 80,
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
    marginBottom: 28,
    marginHorizontal: 28,
  },
  listContent: {
    gap: 14,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d9e8f5',
  },
  cardHeader: {
    marginBottom: 10,
  },
  tripName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#090909',
  },
  destination: {
    fontSize: 13,
    color: '#4a7ca8',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#d9e8f5',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#7a9ab8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a3d5c',
  },
  dateSeparator: {
    width: 1,
    height: 32,
    backgroundColor: '#d9e8f5',
    marginHorizontal: 16,
  },
  description: {
    marginTop: 12,
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
  buttonContainer: {
    gap: 12,
  },
  participationButton: {
    backgroundColor: '#d9e8f5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  participationButtonText: {
    color: '#4a7ca8',
    fontSize: 15,
    fontWeight: '700',
  },
  createButton: {
    marginTop: 20,
    alignSelf: 'center',
    minWidth: 290,
  },
});
