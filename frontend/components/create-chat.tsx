import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useAuth, useUser } from '@clerk/expo';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

interface Trip {
  id: number;
  name: string;
}

interface ChatParticipant {
  userId: number;
  email: string;
  name: string;
  type: 'participant' | 'invitation';
}

export default function CreateChatScreen() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const getTokenRef = React.useRef(getToken);

  React.useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const [title, setTitle] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTripDropdown, setShowTripDropdown] = useState(false);

  // Fetch authenticated user's trips
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getTokenRef.current({ template: "RollCallAuth" });
        const response = await fetch(`${API_BASE_URL}/api/trips/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: Trip[] = response.ok ? await response.json() : [];
        setTrips(data);
      } catch (err) {
        console.error('Failed to fetch trips:', err);
        setError('Failed to load trips');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // Fetch participants when trip is selected
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!selectedTripId) {
        setParticipants([]);
        setSelectedParticipants(new Set());
        return;
      }

      try {
        setLoadingParticipants(true);
        const token = await getTokenRef.current({ template: "RollCallAuth" });

        // Fetch accepted participants with email
        const participantsResponse = await fetch(
          `${API_BASE_URL}/api/participants/trip/${selectedTripId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const participantsData = participantsResponse.ok
          ? await participantsResponse.json()
          : [];

        // Fetch pending invitations
        const invitationsResponse = await fetch(
          `${API_BASE_URL}/api/invitations?tripId=${selectedTripId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const invitationsData = invitationsResponse.ok
          ? await invitationsResponse.json()
          : [];

        // Combine participants and invitations
        const participantMap = new Map<number, ChatParticipant>();

        // Add participants
        participantsData.forEach((p: any) => {
          if (p.userId && !participantMap.has(p.userId)) {
            participantMap.set(p.userId, {
              userId: p.userId,
              email: p.email || '',
              name: p.name || p.email || 'Unknown',
              type: 'participant',
            });
          }
        });

        // Add invitations
        invitationsData.forEach((inv: any) => {
          const email = inv.email || inv.userEmail;
          const tempId = -Math.abs(email.charCodeAt(0)) - Math.random() * 1000;
          if (!participantMap.has(tempId)) {
            participantMap.set(tempId, {
              userId: tempId,
              email: email,
              name: email.split('@')[0],
              type: 'invitation',
            });
          }
        });

        setParticipants(Array.from(participantMap.values()));
      } catch (err) {
        console.error('Failed to fetch participants:', err);
        setError('Failed to load participants');
      } finally {
        setLoadingParticipants(false);
      }
    };

    fetchParticipants();
  }, [selectedTripId]);

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

  const handleCreateChat = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a chat title');
      return;
    }

    if (!selectedTripId) {
      Alert.alert('Error', 'Please select a trip');
      return;
    }

    if (selectedParticipants.size === 0) {
      Alert.alert('Error', 'Please select at least one participant');
      return;
    }

    try {
      setCreating(true);
      const token = await getTokenRef.current({ template: "RollCallAuth" });

      // Create chat
      const chatPayload = {
        tripId: selectedTripId,
        title: title.trim(),
      };
      
      console.log('Creating chat with payload:', chatPayload);

      const chatResponse = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(chatPayload),
      });

      const responseText = await chatResponse.text();
      console.log('Chat response status:', chatResponse.status);
      console.log('Chat response body:', responseText);

      if (!chatResponse.ok) {
        throw new Error(`Failed to create chat: ${chatResponse.status} - ${responseText}`);
      }

      let chat;
      try {
        chat = JSON.parse(responseText);
      } catch {
        throw new Error(`Failed to parse chat response: ${responseText}`);
      }

      // Get the creator's userId from the participants list
      const creatorEmail = clerkUser?.primaryEmailAddress?.emailAddress;
      let creatorUserId: number | null = null;

      if (creatorEmail && participants.length > 0) {
        const creatorParticipant = participants.find(
          p => p.email.toLowerCase() === creatorEmail.toLowerCase()
        );
        if (creatorParticipant) {
          creatorUserId = creatorParticipant.userId;
        }
      }

      // Add participants to chat using userId
      const userIdsToAdd = Array.from(selectedParticipants);
      
      // Ensure creator is added as a participant (if they have a valid userId)
      if (creatorUserId && creatorUserId > 0 && !userIdsToAdd.includes(creatorUserId)) {
        userIdsToAdd.push(creatorUserId);
      }

      for (const userId of userIdsToAdd) {
        // Skip negative IDs (pending invitations)
        if (userId > 0) {
          try {
            await fetch(`${API_BASE_URL}/api/chat-participants`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                chatId: chat.id,
                userId: userId,
              }),
            });
          } catch (err) {
            console.error(`Failed to add participant ${userId}:`, err);
          }
        }
      }

      Alert.alert('Success', 'Chat created successfully');
      router.replace("/(app)/(tabs)/chats");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Failed to create chat:', errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setCreating(false);
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

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create Chat</Text>

        {/* Chat Title Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Chat Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter chat title"
            value={title}
            onChangeText={setTitle}
            editable={!creating}
          />
        </View>

        {/* Trip Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Trip</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowTripDropdown(!showTripDropdown)}
            disabled={creating}
          >
            <Text
              style={[
                styles.dropdownButtonText,
                !selectedTrip && styles.dropdownPlaceholder,
              ]}
            >
              {selectedTrip ? selectedTrip.name : 'Choose a trip...'}
            </Text>
            <Text style={styles.dropdownArrow}>{showTripDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showTripDropdown && (
            <View style={styles.dropdownMenu}>
              {trips.length === 0 ? (
                <Text style={styles.dropdownEmpty}>No trips available</Text>
              ) : (
                trips.map((trip) => (
                  <TouchableOpacity
                    key={trip.id}
                    style={[
                      styles.dropdownItem,
                      selectedTripId === trip.id && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedTripId(trip.id);
                      setShowTripDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedTripId === trip.id && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {trip.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Participants Selection */}
        {selectedTripId && (
          <View style={styles.section}>
            <Text style={styles.label}>
              Select Participants ({selectedParticipants.size})
            </Text>

            {loadingParticipants ? (
              <ActivityIndicator size="small" color="#76b6ee" />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : participants.length === 0 ? (
              <Text style={styles.emptyText}>No participants available for this trip</Text>
            ) : (
              <FlatList
                scrollEnabled={false}
                data={participants}
                keyExtractor={(item) => item.userId.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.participantItem}
                    onPress={() => toggleParticipant(item.userId)}
                    disabled={creating}
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
                        {item.type === 'participant' ? '✓ Accepted' : '◐ Invited'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
            disabled={creating}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.createButton,
              (creating ||
                !selectedTripId ||
                selectedParticipants.size === 0) &&
                styles.createButtonDisabled,
            ]}
            onPress={handleCreateChat}
            disabled={
              creating || !selectedTripId || selectedParticipants.size === 0
            }
          >
            {creating ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Create Chat</Text>
            )}
          </TouchableOpacity>
        </View>
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
  dropdownButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9e8f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#c2d8e8',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#7a9bb5',
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9e8f5',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#d9e8f5',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f7ff',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#000000',
  },
  dropdownItemTextSelected: {
    color: '#4a7ca8',
    fontWeight: '600',
  },
  dropdownEmpty: {
    fontSize: 14,
    color: '#7a9bb5',
    textAlign: 'center',
    paddingVertical: 12,
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
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 12,
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
  createButton: {
    backgroundColor: '#4a7ca8',
  },
  createButtonDisabled: {
    backgroundColor: '#c2d8e8',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
