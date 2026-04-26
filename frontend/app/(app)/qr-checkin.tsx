import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@clerk/expo';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

export default function QrCheckinScreen() {
  const { eventId, token: initialToken, expiresAt: initialExpiresAt } = useLocalSearchParams<{
    eventId: string;
    token?: string;
    expiresAt?: string;
  }>();
  const router = useRouter();
  const { getToken } = useAuth();

  const [token, setToken] = useState<string | null>(initialToken ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startQrSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authToken = await getToken({ template: "RollCallAuth" });
      const response = await fetch(`${API_BASE_URL}/api/checkins/sessions/start/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ sessionType: 'qr' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();
      setToken(data.token ?? null);
      setExpiresAt(data.expiresAt ?? null);
    } catch {
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, getToken]);

  useEffect(() => {
    if (!token) {
      void startQrSession();
      return;
    }

    setIsLoading(false);
  }, [startQrSession, token]);

  const formatExpiry = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Go back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>QR Check-in</Text>
      <Text style={styles.subtitle}>Participants can scan this code to check in</Text>

      <View style={styles.qrContainer}>
        {isLoading && <ActivityIndicator size="large" color="#4a7ca8" />}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {token && !isLoading && (
          <>
            <QRCode
              value={`frontend://qr-validate?token=${encodeURIComponent(token)}&eventId=${encodeURIComponent(String(eventId))}`}
              size={240}
              color="#090909"
              backgroundColor="#ffffff"
            />
            <Text style={styles.expiryText}>
              Expires at {expiresAt ? formatExpiry(expiresAt) : '—'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#c7e2f8',
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 15,
    color: '#4a7ca8',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#090909',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 40,
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 300,
    justifyContent: 'center',
  },
  expiryText: {
    marginTop: 20,
    fontSize: 14,
    color: '#888',
  },
  errorText: {
    color: '#c0392b',
    textAlign: 'center',
  },
});
