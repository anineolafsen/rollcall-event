import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { useUser } from '@clerk/expo';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  SafeAreaView,
} from 'react-native';

import EmailInviteUploader, { UploadState } from '@/components/invitationsFileUpload';
import { AppButton } from '@/components/ui/button';

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
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  const isMobileStandalone = !embedded && !isDesktopWeb;
  const searchParams = useLocalSearchParams();
  const tripId = tripIdProp ?? (searchParams.tripId ? Number(searchParams.tripId) : null);
  const tripName = tripNameProp ?? (searchParams.tripName as string | undefined) ?? null;
  const showDesktopBackButton = !embedded && isDesktopWeb;
  const { user, isLoaded } = useUser();
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const organizerEmail = isLoaded ? user?.emailAddresses[0]?.emailAddress || null : null;

  if (!tripId || !tripName) {
    return (
      <SafeAreaView style={embedded ? styles.embeddedScreen : styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Invalid trip information</Text>
        </View>
        <AppButton
          label="Done"
          style={{ marginTop: 24 }}
          onPress={() => router.push(`/trips/${tripId}`)}
        />
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

  if (embedded) {
    return (
      <View style={styles.embeddedCard}>
        <View style={styles.embeddedContent}>
          <EmailInviteUploader
            tripId={tripId}
            apiUrl={process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/api` : 'http://localhost:5118/api'}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, isMobileStandalone && styles.mobileScreen]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, isMobileStandalone && styles.mobileHeader]}>
          {showDesktopBackButton ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Go back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.mobileBackButton}
              onPress={handleBack}
            >
              <MaterialIcons name="arrow-back" size={20} color="#1a3d5c" />
            </TouchableOpacity>
          )}

          <Text style={[styles.title, isMobileStandalone && styles.mobileTitle]}>
            Invite Participants
          </Text>
          <Text style={[styles.tripName, isMobileStandalone && styles.mobileTripName]}>
            {tripName}
          </Text>
          <View style={[styles.divider, isMobileStandalone && styles.mobileDivider]} />
        </View>

        <View style={[styles.content, isMobileStandalone && styles.mobileContent]}>
          <View style={isMobileStandalone ? styles.embeddedCard : undefined}>
            <View style={isMobileStandalone ? styles.embeddedContent : undefined}>
              <EmailInviteUploader
                tripId={tripId}
                apiUrl={process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/api` : 'http://localhost:5118/api'}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={{ padding: 24 }}>
        <AppButton
          label="Done"
          variant="edit"
          style={{ minWidth: '100%', minHeight: 56, borderRadius: 14 }}
          onPress={() => router.push(`/trips/${tripId}`)}
        />
      </View>
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
  mobileScreen: {
    backgroundColor: '#eef5fb',
  },
  embeddedScreen: {
    backgroundColor: 'transparent',
  },
  embeddedCard: {
    backgroundColor: '#eef5fb',
    borderRadius: 18,
    overflow: 'hidden',
  },
  embeddedContent: {
    paddingVertical: 12,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mobileScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 128,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: '#eef5fb',
  },
  mobileHeader: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 0,
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  mobileBackButton: {
    position: 'absolute',
    left: 20,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9e8f5',
    shadowColor: '#0b2540',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
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
    marginBottom: 2,
  },
  mobileTitle: {
    fontSize: 23,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: 48,
    marginTop: 30,
  },
  tripName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 0,
    fontWeight: '500',
    textAlign: 'center',
  },
  mobileTripName: {
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
  mobileDivider: {
    height: 3,
    marginHorizontal: 28,
    marginTop: 14,
    marginBottom: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: '#eef5fb',
  },
  mobileContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 24,
  },
  completeButton: {
    minHeight: 52,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
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
