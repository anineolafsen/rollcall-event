import { useLocalSearchParams, useRouter } from 'expo-router';
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

import EmailInviteUploader from '@/components/invitationsFileUpload';

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
  const showBackButton = !embedded && isDesktopWeb;

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
          {showBackButton ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Go back</Text>
            </TouchableOpacity>
          ) : null}

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
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
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
  mobileTitle: {
    textAlign: 'center',
  },
  tripName: {
    fontSize: 16,
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
    alignSelf: 'stretch',
    marginHorizontal: 28,
    marginTop: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: '#eef5fb',
  },
  mobileContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 24,
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
