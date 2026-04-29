import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';

import { AppButton } from '@/components/ui/button';
import EmailInviteUploader, { type UploadState } from '@/components/invitationsFileUpload';

export default function InvitationsView() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const tripId = searchParams.tripId ? Number(searchParams.tripId) : null;
  const tripName = searchParams.tripName as string;
  const [uploadState, setUploadState] = useState<UploadState>('idle');

  if (!tripId || !tripName) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Invalid trip information</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    router.push('/trips');
  };

  const handleComplete = () => {
    router.replace('/trips');
  };

  const isLoading = uploadState === 'submitting';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Go back</Text>
          </TouchableOpacity>

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
          <AppButton
            variant="edit"
            style={styles.completeButton}
            label={isLoading ? 'Sending...' : 'Done'}
            onPress={handleComplete}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },
  scroll: {
    backgroundColor: '#eef5fb',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: '#eef5fb',
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
    color: '#090909',
    textAlign: 'center',
    marginBottom: 4,
  },
  tripName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 0,
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    height: 3,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 28,
    marginHorizontal: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: '#eef5fb',
  },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#d0e5f7',
    backgroundColor: '#eef5fb',
  },
  completeButton: {
    minHeight: 52,
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
