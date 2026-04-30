import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/expo';
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
  Modal,
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

interface Chat {
  id: number;
  tripId: number;
  title: string;
  creatorId: number;
  createdAt: string;
}

interface Trip {
  id: number;
  name: string;
}

interface Participant {
  userId: number;
  email: string;
  name: string;
  type: 'participant' | 'invitation';
}

export default function EditChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();

  const [chat, setChat] = useState<Chat | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const chatID = id ? Number(id) : null;

  // Fetch current user's internal ID from API
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = await getToken({ template: 'RollCallAuth' });
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.id);
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };
    fetchCurrentUser();
  }, [getToken]);

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

        const token = await getToken({ template: 'RollCallAuth' });

        // Fetch chat
        const chatRes = await fetch(`${API_BASE_URL}/api/chats/${chatID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!chatRes.ok) throw new Error('Failed to load chat');
        const chatData: Chat = await chatRes.json();
        setChat(chatData);
        setTitle(chatData.title);

        // Fetch trip
        const tripRes = await fetch(`${API_BASE_URL}/api/trips/${chatData.tripId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (tripRes.ok) {
          const tripData: Trip = await tripRes.json();
          setTrip(tripData);
        }

        // Fetch current chat participants
        const partRes = await fetch(`${API_BASE_URL}/api/chat-participants/chat/${chatID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currentChatParticipants: any[] = partRes.ok ? await partRes.json() : [];
        const participantIds = currentChatParticipants.map((p: any) => p.userId);
        setSelectedParticipants(new Set(participantIds));

        // Fetch available participants from trip
        const tripPartRes = await fetch(
          `${API_BASE_URL}/api/participants/trip/${chatData.tripId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const tripPartData = tripPartRes.ok ? await tripPartRes.json() : [];

        const participantMap = new Map<number, Participant>();

        // Add participants (accepted)
        tripPartData.forEach((p: any) => {
          const userId = p.userId;
          if (userId && !participantMap.has(userId)) {
            participantMap.set(userId, {
              userId: userId,
              email: p.email || '',
              name: p.name || p.email || 'Unknown',
              type: 'participant',
            });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatID]);

  // Check creator after chat is loaded
  useEffect(() => {
    if (chat && currentUserId) {
      const isCreatorMatch = chat.creatorId === currentUserId;
      setIsCreator(isCreatorMatch);
    } else {
      setIsCreator(false);
    }
  }, [chat, currentUserId]);

  const toggleParticipant = useCallback((userId: number) => {
    setSelectedParticipants((prev) => {
      const updated = new Set(prev);
      if (updated.has(userId)) {
        updated.delete(userId);
      } else {
        updated.add(userId);
      }
      return updated;
    });
  }, []);

  const handleSave = async () => {
    if (!isCreator) {
      Alert.alert('Permission Denied', 'Only the chat creator can edit this chat');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a chat title');
      return;
    }

    if (!chat) return;

    try {
      setSaving(true);

      const token = await getToken({ template: 'RollCallAuth' });
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Update chat title
      const updateRes = await fetch(`${API_BASE_URL}/api/chats/${chatID}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          tripId: chat.tripId,
          title: title.trim(),
          creatorId: chat.creatorId,
          createdAt: chat.createdAt,
        }),
      });

      if (!updateRes.ok) throw new Error('Failed to update chat');

      // Get current participants
      const currentRes = await fetch(`${API_BASE_URL}/api/chat-participants/chat/${chatID}`, {
        headers,
      });
      const currentParticipants: { userId: number }[] = currentRes.ok ? await currentRes.json() : [];
      const currentUserIds = new Set(currentParticipants.map((p) => p.userId));

      // Remove participants that were deselected
      for (const userId of currentUserIds) {
        if (!selectedParticipants.has(userId)) {
          await fetch(`${API_BASE_URL}/api/chat-participants/${chatID}/${userId}`, {
            method: 'DELETE',
            headers,
          });
        }
      }

      // Add new participants
      for (const userId of selectedParticipants) {
        if (!currentUserIds.has(userId)) {
          await fetch(`${API_BASE_URL}/api/chat-participants`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              chatId: chatID,
              userId: userId,
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
    if (!isCreator) {
      Alert.alert('Permission Denied', 'Only the chat creator can delete this chat');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    
    try {
      setDeleting(true);
      const token = await getToken({ template: 'RollCallAuth' });
      const deleteUrl = `${API_BASE_URL}/api/chats/${chatID}`;

      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete chat (HTTP ${res.status}): ${errorText}`);
      }

      setShowDeleteConfirm(false);
      
      // Small delay to ensure modal closes before navigation
      setTimeout(() => {
        router.replace('/(app)/(tabs)/chats');
      }, 100);
    } catch (err) {
      console.error('Failed to delete chat:', err);
      Alert.alert('Error', `Failed to delete chat: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeleting(false);
    }
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
        {isCreator ? (
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
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>Chat Title</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>{title}</Text>
            </View>
          </View>
        )}

        {/* Trip (Read-only) */}
        <View style={styles.section}>
          <Text style={styles.label}>Trip</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>{trip?.name || 'Loading...'}</Text>
          </View>
        </View>

        {/* Participants */}
        {isCreator && (
          <View style={styles.section}>
            <Text style={styles.label}>Participants ({selectedParticipants.size})</Text>
            {participants.length === 0 ? (
              <Text style={styles.emptyText}>No participants available</Text>
            ) : (
              <FlatList
                scrollEnabled={false}
                data={participants}
                keyExtractor={(item) => item.userId.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.participantItem}
                    onPress={() => toggleParticipant(item.userId)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        selectedParticipants.has(item.userId) && styles.checkboxChecked,
                      ]}
                    >
                      {selectedParticipants.has(item.userId) && (
                        <Text style={styles.checkboxMark}>✓</Text>
                      )}
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantEmail}>{item.name}</Text>
                      <Text style={styles.participantType}>
                        {item.type === 'invitation' ? '(Invited)' : '(Participant)'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* Action Buttons */}
        {isCreator && (
          <>
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
          </>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteConfirm(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Chat?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this chat? This action cannot be undone.
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalDeleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  readOnlyWarning: {
    fontSize: 12,
    color: '#ff9800',
    marginBottom: 8,
    fontStyle: 'italic',
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
  checkboxDisabled: {
    opacity: 0.5,
    borderColor: '#b0bfd4',
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
    backgroundColor: '#d32f2f',
    borderWidth: 1,
    borderColor: '#d32f2f',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#090909',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#565656',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#d9e8f5',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a7ca8',
  },
  modalDeleteButton: {
    backgroundColor: '#d32f2f',
  },
  modalDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
