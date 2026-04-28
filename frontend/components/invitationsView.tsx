import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

import EmailInviteUploader, { type UploadState } from '@/components/invitationsFileUpload';

type InvitationsViewProps = {
  embedded?: boolean;
  tripId?: number | null;
  tripName?: string | null;
};

export default function InvitationsView({
  embedded = false,
  tripId: tripIdProp,
  tripName: tripNameProp,
}: InvitationsViewProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const searchParams = useLocalSearchParams();
  const tripId = tripIdProp ?? (searchParams.tripId ? Number(searchParams.tripId) : null);
  const tripName = tripNameProp ?? (searchParams.tripName as string | undefined) ?? null;
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const showBackButton = !embedded && Platform.OS === 'web' && width >= 900;
  const isLoading = uploadState === 'submitting';

  if (!tripId || !tripName) {
    return (
      <SafeAreaView style={embedded ? styles.embeddedScreen : styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Invalid trip information</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.push('/trips');
  };

  const handleComplete = () => {
    router.replace('/trips');
  };

  if (embedded) {
    return (
      <View style={styles.embeddedCard}>
        <View style={styles.embeddedContent}>
          <EmailInviteUploader
            tripId={tripId}
            apiUrl={process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/api` : 'http://localhost:5118/api'}
            onStateChange={setUploadState}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {showBackButton ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Go back</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.title}>Invite Participants</Text>
          <Text style={styles.tripName}>{tripName}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.content}>
          <EmailInviteUploader
            tripId={tripId}
            apiUrl={process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/api` : 'http://localhost:5118/api'}
            onStateChange={setUploadState}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.completeButton, isLoading && styles.completeButtonLoading]}
            onPress={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.completeButtonText}>Done</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  embeddedScreen: {
    backgroundColor: 'transparent',
  },
  embeddedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d9e8f5',
    overflow: 'hidden',
  },
  embeddedContent: {
    paddingVertical: 12,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#eef5fb',
  },
  backButton: {
    marginBottom: 16,
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
    color: '#090909',
    marginBottom: 4,
  },
  tripName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  divider: {
    height: 2,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  completeButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeButtonLoading: {
    opacity: 0.7,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
});
