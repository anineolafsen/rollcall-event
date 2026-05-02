import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/expo';
import {
  ActivityIndicator,
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
import { AppButton } from '@/components/ui/button';
import { getTripParticipants, type TripParticipantDto } from '@/lib/participants';

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
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [participants, setParticipants] = useState<TripParticipantDto[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const organizerEmail = isLoaded ? user?.emailAddresses[0]?.emailAddress || null : null;

  useEffect(() => {
    if (!tripId) {
      setParticipants([]);
      setParticipantsLoading(false);
      return;
    }

    let cancelled = false;

    const loadParticipants = async (showLoadingState = false) => {
      try {
        if (showLoadingState) {
          setParticipantsLoading(true);
        }
        setParticipantsError(null);
        const token = await getToken({ template: 'RollCallAuth' });
        const data = await getTripParticipants(tripId, token);

        if (!cancelled) {
          setParticipants(data);
        }
      } catch {
        if (!cancelled) {
          setParticipantsError('Could not load participants.');
        }
      } finally {
        if (!cancelled && showLoadingState) {
          setParticipantsLoading(false);
        }
      }
    };

    void loadParticipants(true);

    const pollId = setInterval(() => {
      void loadParticipants(false);
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(pollId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

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

  const participantList = (
    <View style={styles.participantsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Current participants</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{participants.length}</Text>
        </View>
      </View>

      {participantsLoading ? (
        <View style={styles.participantsState}>
          <ActivityIndicator size="small" color="#76b6ee" />
        </View>
      ) : participantsError ? (
        <Text style={styles.participantsErrorText}>{participantsError}</Text>
      ) : participants.length === 0 ? (
        <Text style={styles.participantsEmptyText}>No participants yet.</Text>
      ) : (
        <View style={styles.participantsList}>
          {participants.map((participant) => {
            const displayName = participant.name.trim() || participant.email;

            return (
              <View key={participant.userId} style={styles.participantRow}>
                <View style={styles.participantTextBlock}>
                  <Text style={styles.participantName}>{displayName}</Text>
                  <Text style={styles.participantEmail}>{participant.email}</Text>
                </View>
                {participant.isOrganizer ? (
                  <View style={styles.organizerBadge}>
                    <Text style={styles.organizerBadgeText}>Organizer</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  if (embedded) {
    return (
      <View style={styles.embeddedCard}>
        <View style={styles.embeddedContent}>
          <EmailInviteUploader
            tripId={tripId}
            organizerEmail={organizerEmail}
            apiUrl={process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/api` : 'http://localhost:5118/api'}
          />
          <View style={styles.sectionDivider} />
          {participantList}
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
                organizerEmail={organizerEmail}
                apiUrl={process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/api` : 'http://localhost:5118/api'}
              />
              <View style={styles.sectionDivider} />
              {participantList}
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
  sectionDivider: {
    height: 1,
    backgroundColor: '#ffffffff',
    marginHorizontal: 16,
    marginVertical: 8,
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
  participantsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  countBadge: {
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#d9e8f5',
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a3d5c',
  },
  participantsState: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  participantsErrorText: {
    fontSize: 13,
    color: '#b91c1c',
  },
  participantsEmptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  participantsList: {
    borderWidth: 1,
    borderColor: '#d9e8f5',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef5fb',
  },
  participantTextBlock: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  participantEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  organizerBadge: {
    borderWidth: 1.1,
    borderColor: '#f0b43a',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  organizerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#090909',
  },
});
