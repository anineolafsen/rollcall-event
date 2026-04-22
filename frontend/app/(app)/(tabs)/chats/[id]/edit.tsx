import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

interface Chat {
  chatID: number;
  tripID: number;
  title: string;
  creatorID: string;
  createdAt: string;
}

interface Trip {
  tripID: number;
  name: string;
}

interface Participant {
  email: string;
  type: 'participant' | 'invitation';
}

export default function EditChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [chat, setChat] = useState<Chat | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatID = id ? Number(id) : null;

  // Load chat data
  useEffect(() => {
    const fetchData = async () => {
      if (!chatID) {
        setError('Chat ID is required');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch chat
        const chatRes = await fetch(`${API_BASE_URL}/api/chats/${chatID}`);
        if (!chatRes.ok) throw new Error('Failed to load chat');
        const chatData: Chat = await chatRes.json();
        setChat(chatData);
        setTitle(chatData.title);

        // Fetch trip
        const tripRes = await fetch(`${API_BASE_URL}/api/trips/${chatData.tripID}`);
        if (tripRes.ok) {
          const tripData: Trip = await tripRes.json();
          setTrip(tripData);
        }

        // Fetch current participants
        const partRes = await fetch(`${API_BASE_URL}/api/chat-participants/chat/${chatID}`);
        if (partRes.ok) {
          const partData = await partRes.json();
          const participantEmails = partData.map((p: any) => p.userEmail);
          setSelectedParticipants(new Set(participantEmails));
        }

        // Fetch available participants from trip
        const tripPartRes = await fetch(
          `${API_BASE_URL}/api/participants/trip/${chatData.tripID}`
        );
        const tripPartData = tripPartRes.ok ? await tripPartRes.json() : [];

        const invitRes = await fetch(`${API_BASE_URL}/api/invitations?tripId=${chatData.tripID}`);
        const invitData = invitRes.ok ? await invitRes.json() : [];

        const participantMap = new Map<string, Participant>();
        tripPartData.forEach((p: any) => {
          if (p.userID && !participantMap.has(p.userID)) {
            participantMap.set(p.userID, { email: p.userID, type: 'participant' });
          }
        });

        invitData.forEach((inv: any) => {
          if (!participantMap.has(inv.userEmail)) {
            participantMap.set(inv.userEmail, { email: inv.userEmail, type: 'invitation' });
          }
        });

        setParticipants(Array.from(participantMap.values()));
      } catch (err) {
        console.error('Failed to fetch chat data:', err);
        setError('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chatID]);

  const toggleParticipant = useCallback((email: string) => {
    setSelectedParticipants((prev) => {
      const updated = new Set(prev);
      if (updated.has(email)) {
        updated.delete(email);
      } else {
        updated.add(email);
      }
      return updated;
    });
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a chat title');
      return;
    }

    if (!chat) return;

    try {
      setSaving(true);

      // Update chat title
      const updateRes = await fetch(`${API_BASE_URL}/api/chats/${chatID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripID: chat.tripID,
          title: title.trim(),
          creatorID: chat.creatorID,
          createdAt: chat.createdAt,
        }),
      });

      if (!updateRes.ok) throw new Error('Failed to update chat');

      // Get current participants
      const currentRes = await fetch(`${API_BASE_URL}/api/chat-participants/chat/${chatID}`);
      const currentParticipants: { userEmail: string }[] = currentRes.ok ? await currentRes.json() : [];
      const currentEmails = new Set(currentParticipants.map((p) => p.userEmail));

      // Remove participants that were deselected
      for (const email of currentEmails) {
        if (!selectedParticipants.has(email)) {
          await fetch(`${API_BASE_URL}/api/chat-participants/${chatID}/${email}`, {
            method: 'DELETE',
          });
        }
      }

      // Add new participants
      for (const email of selectedParticipants) {
        if (!currentEmails.has(email)) {
          await fetch(`${API_BASE_URL}/api/chat-participants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatID,
              userEmail: email,
            }),
          });
        }
      }

      Alert.alert('Success', 'Chat updated successfully');
      router.back();
    } catch (err) {
      console.error('Failed to save chat:', err);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Chat', 'Are you sure you want to delete this chat? This cannot be undone.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setDeleting(true);

            const res = await fetch(`${API_BASE_URL}/api/chats/${chatID}`, {
              method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete chat');

            Alert.alert('Success', 'Chat deleted successfully');
            router.back();
          } catch (err) {
            console.error('Failed to delete chat:', err);
            Alert.alert('Error', 'Failed to delete chat');
          } finally {
            setDeleting(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#76b6ee" />
        </View>
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Chat not found'}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Edit Chat</Text>

        {/* Chat Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Chat Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter chat title"
            value={title}
            onChangeText={setTitle}
            editable={!saving}
          />
        </View>

        {/* Trip (Read-only) */}
        <View style={styles.section}>
          <Text style={styles.label}>Trip</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>{trip?.name || 'Loading...'}</Text>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.label}>Participants ({selectedParticipants.size})</Text>
          {participants.length === 0 ? (
            <Text style={styles.emptyText}>No participants available</Text>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={participants}
              keyExtractor={(item) => item.email}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.participantItem}
                  onPress={() => toggleParticipant(item.email)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selectedParticipants.has(item.email) && styles.checkboxChecked,
                    ]}
                  >
                    {selectedParticipants.has(item.email) && (
                      <Text style={styles.checkboxMark}>✓</Text>
                    )}
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantEmail}>{item.email}</Text>
                    <Text style={styles.participantType}>
                      {item.type === 'invitation' ? '(Invited)' : '(Member)'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
            disabled={saving || deleting}
          >
            <Text style={styles.buttonTextCancel}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, (saving || deleting) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving || deleting}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.buttonDisabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#d32f2f" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Chat</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#090909',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9e8f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000000',
  },
  readOnlyInput: {
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 14,
    color: '#4a7ca8',
    fontWeight: '500',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9e8f5',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4a7ca8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#4a7ca8',
    borderColor: '#4a7ca8',
  },
  checkboxMark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  participantType: {
    fontSize: 12,
    color: '#4a7ca8',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#7a9bb5',
    textAlign: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#d9e8f5',
  },
  saveButton: {
    backgroundColor: '#4a7ca8',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a7ca8',
  },
  deleteButton: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ffb74d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
  },
});
