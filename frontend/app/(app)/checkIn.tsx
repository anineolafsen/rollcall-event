import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { CheckInCard } from '@/components/ui/checkin/check-in-card';
import { useAuth } from '@clerk/expo';
import { useEffect, useState } from 'react';

export default function CheckinScreen() {
  const { tripId, eventId, isOrganizer } = useLocalSearchParams<{
    tripId: string;
    eventId: string;
    isOrganizer?: string;
  }>();
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      const nextToken = await getToken({ template: "RollCallAuth" });
      setToken(nextToken);
      setTokenLoaded(true);
    };

    void loadToken();
  }, [getToken]);

  if (!tokenLoaded || !token) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <CheckInCard
        eventId={String(eventId)}
        tripId={String(tripId)}
        isOrganizer={String(isOrganizer) === 'true'}
        token={token}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
