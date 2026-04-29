import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/button';
import { SelectionChip } from '@/components/ui/selection-chip';
import { smsProvider } from '@/services/sms';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';
const MAX_CHARS = 160;

type Contact = { userId: number; name: string; phone: string };

export default function NotifyScreen() {
  const { id, tripName } = useLocalSearchParams<{ id: string; tripName?: string }>();
  const router = useRouter();
  const { getToken } = useAuth();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = await getToken({ template: 'RollCallAuth' });
        const response = await fetch(`${API_BASE_URL}/api/participants/trip/${id}/contact`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error();
        const data: Contact[] = await response.json();
        setContacts(data);
      } catch {
        Alert.alert('Error', 'Could not load participants.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchContacts();
  }, [id, getToken]);

  const handleSend = async () => {
    setSending(true);
    const recipients = contacts.map(c => ({
      id: String(c.userId),
      name: c.name,
      phone: c.phone,
    }));

    let sent = 0;
    try {
      const result = await smsProvider.sendSms(recipients, message.trim());
      sent = result.sentCount;
    } catch (error) {
      console.error('[NotifyScreen] Send error:', error);
    }

    setSentCount(sent);
    setSending(false);
  };

  const charCount = message.length;
  const overLimit = charCount > MAX_CHARS;
  const canSend = !sending && message.trim().length > 0;

  if (sentCount !== null) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.successContainer}>
          <MaterialIcons name="check-circle" size={72} color="#4a7ca8" />
          <Text style={styles.successTitle}>Message sent!</Text>
          <Text style={styles.successSubtitle}>
            {sentCount === 0
              ? 'No participants had a registered phone number'
              : `Sent to ${sentCount} participant${sentCount !== 1 ? 's' : ''}`}
          </Text>
          <AppButton
            label="Done"
            onPress={() => router.replace({ pathname: '/trips/[id]', params: { id } })}
            style={styles.doneButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace({ pathname: '/trips/[id]', params: { id } })}
            >
              <Text style={styles.backButtonText}>← Go back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Notify all participants</Text>
            {tripName ? <Text style={styles.tripName}>{tripName}</Text> : null}
            <View style={styles.divider} />
          </View>

          <View style={styles.content}>
            <Text style={styles.sectionLabel}>Channel</Text>
            <View style={styles.channelRow}>
              <View style={styles.channelItem}>
                <SelectionChip label="SMS" selected onPress={() => {}} />
              </View>
              <View style={[styles.channelItem, styles.channelDisabled]}>
                <SelectionChip label="Push notification" selected={false} onPress={() => {}} />
              </View>
            </View>

            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Message</Text>
            <TextInput
              style={[styles.messageInput, overLimit && styles.messageInputError]}
              multiline
              numberOfLines={5}
              placeholder="Write your message here..."
              placeholderTextColor="#b8bcc2"
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
            <View style={styles.charCountRow}>
              {overLimit && (
                <Text style={styles.charWarning}>
                  Over 160 characters — may be split into multiple SMS
                </Text>
              )}
              <Text style={[styles.charCount, overLimit && styles.charCountOver]}>
                {charCount}/160
              </Text>
            </View>

            {!loading && (
              <View style={styles.recipientInfo}>
                <MaterialIcons name="people" size={16} color="#4a7ca8" />
                <Text style={styles.recipientText}>
                  {contacts.length === 0
                    ? 'No participants have a registered phone number'
                    : `${contacts.length} participant${contacts.length !== 1 ? 's' : ''} will receive this SMS`}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {loading ? (
            <ActivityIndicator color="#4a7ca8" />
          ) : (
            <AppButton
              variant="edit"
              label={
                sending
                  ? 'Sending...'
                  : `Send to ${contacts.length} participant${contacts.length !== 1 ? 's' : ''}`
              }
              onPress={handleSend}
              disabled={!canSend}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 20,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#090909',
    marginBottom: 4,
  },
  tripName: {
    fontSize: 15,
    color: '#4a7ca8',
    fontWeight: '500',
    marginBottom: 14,
  },
  divider: {
    height: 2,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 12,
  },
  sectionLabelSpaced: {
    marginTop: 28,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  channelItem: {
    flex: 1,
    minHeight: 56,
  },
  channelDisabled: {
    opacity: 0.45,
  },
  comingSoonBadge: {
    marginTop: 6,
    alignSelf: 'center',
  },
  comingSoonText: {
    fontSize: 12,
    color: '#7a9ab8',
    fontStyle: 'italic',
  },
  messageInput: {
    minHeight: 130,
    borderRadius: 12,
    backgroundColor: '#fbf5f4',
    borderWidth: 1,
    borderColor: '#e9e1df',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111111',
    textAlignVertical: 'top',
  },
  messageInputError: {
    borderColor: '#d95c5c',
  },
  charCountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  charWarning: {
    flex: 1,
    fontSize: 13,
    color: '#c04343',
  },
  charCount: {
    fontSize: 13,
    color: '#7a9ab8',
  },
  charCountOver: {
    color: '#c04343',
    fontWeight: '600',
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    backgroundColor: '#ddeaf7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  recipientText: {
    flex: 1,
    fontSize: 14,
    color: '#2a4a6b',
  },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#d9e8f5',
    backgroundColor: '#eef5fb',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#090909',
    marginTop: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#4a7ca8',
    textAlign: 'center',
    lineHeight: 22,
  },
  doneButton: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
});
