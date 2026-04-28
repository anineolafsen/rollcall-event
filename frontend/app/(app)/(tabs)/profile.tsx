import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';

import { AppButton } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type TripNeeds = {
  tripId: number;
  tripName: string;
  allergies: string | null;
  otherInfo: string | null;
};

export default function ProfileScreen() {
  const { getToken } = useAuth();
  const router = useRouter();
  const getTokenRef = useRef(getToken);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tripNeeds, setTripNeeds] = useState<TripNeeds[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [editingTripId, setEditingTripId] = useState<number | null>(null);
  const [draftAllergies, setDraftAllergies] = useState('');
  const [draftOtherInfo, setDraftOtherInfo] = useState('');

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const fetchData = useCallback(async () => {
    try {
      const token = await getTokenRef.current({ template: 'RollCallAuth' });
      const headers = { Authorization: `Bearer ${token}` };

      const [userRes, needsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/me`, { headers }),
        fetch(`${API_BASE_URL}/api/participants/my-trips`, { headers }),
      ]);

      const userData = await userRes.json();
      setFirstName(userData.firstName ?? '');
      setLastName(userData.lastName ?? '');
      setPhone(userData.phone ?? '');

      const needs = await needsRes.json();
      setTripNeeds(needs);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleEditProfile = async () => {
    if (!isEditingProfile) {
      setIsEditingProfile(true);
      return;
    }

    try {
      setIsSavingProfile(true);
      const token = await getToken({ template: 'RollCallAuth' });
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName: firstName || null, lastName: lastName || null, phone: phone || null }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update profile (${response.status})`);
      }

      await fetchData();
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Could not save profile', 'Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const startEditing = (item: TripNeeds) => {
    setEditingTripId(item.tripId);
    setDraftAllergies(item.allergies ?? '');
    setDraftOtherInfo(item.otherInfo ?? '');
  };

  const cancelEditing = () => setEditingTripId(null);

  const saveNeeds = async (tripId: number) => {
    try {
      const token = await getToken({ template: 'RollCallAuth' });
      await fetch(`${API_BASE_URL}/api/participants/${tripId}/needs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          allergies: draftAllergies || null,
          otherInfo: draftOtherInfo || null,
        }),
      });
      setTripNeeds((prev) =>
        prev.map((item) =>
          item.tripId === tripId
            ? { ...item, allergies: draftAllergies || null, otherInfo: draftOtherInfo || null }
            : item
        )
      );
    } catch (error) {
      console.error('Error saving needs:', error);
    }
    setEditingTripId(null);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#76b6ee" />
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
        <View style={styles.content}>
          <Text style={styles.title}>My Profile</Text>
          <View style={styles.titleDivider} />

          <FormField
            label="First name"
            placeholder="Add first name"
            value={firstName}
            onChangeText={setFirstName}
            editable={isEditingProfile}
          />

          <FormField
            label="Last name"
            placeholder="Add last name"
            value={lastName}
            onChangeText={setLastName}
            editable={isEditingProfile}
          />

          <FormField
            label="Phone number"
            placeholder="Add phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="number-pad"
            editable={isEditingProfile}
          />

          <View style={styles.buttonRow}>
            {isEditingProfile && (
              <View style={{ flex: 1 }}>
                <AppButton
                  label="Cancel"
                  onPress={() => {
                      setIsEditingProfile(false);
                    void fetchData();
                  }}
                  style={styles.cancelButton}
                  textStyle={styles.cancelButtonText}
                />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <AppButton
                label={isEditingProfile ? (isSavingProfile ? 'Saving...' : 'Save') : 'Edit profile'}
                onPress={handleEditProfile}
                disabled={isSavingProfile}
              />
            </View>
          </View>

          {tripNeeds.length > 0 && (
            <>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionTitle}>My trips and relevant information</Text>
              <Text style={styles.sectionNote}>This information will be deleted when the trip is finished.</Text>

              {tripNeeds.map((item) =>
                editingTripId === item.tripId ? (
                  <View key={item.tripId} style={styles.tripCard}>
                    <Text style={styles.tripName}>{item.tripName}</Text>

                    <FormField
                      label="Allergies"
                      placeholder="E.g. nuts, gluten, shellfish"
                      value={draftAllergies}
                      onChangeText={setDraftAllergies}
                      multiline
                    />
                    <FormField
                      label="Other needs or important information"
                      placeholder="E.g. wheelchair access, medication"
                      value={draftOtherInfo}
                      onChangeText={setDraftOtherInfo}
                      multiline
                    />
                    <View style={styles.editButtonRow}>
                      <View style={{ flex: 1 }}>
                        <AppButton
                          label="Cancel"
                          onPress={cancelEditing}
                          style={styles.cancelButton}
                          textStyle={styles.cancelButtonText}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppButton label="Save" onPress={() => saveNeeds(item.tripId)} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    key={item.tripId}
                    style={styles.tripCard}
                    onPress={() => router.push(`/trips/${item.tripId}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardRow}>
                      <View style={styles.cardInfo}>
                        <Text style={styles.tripName}>{item.tripName}</Text>

                        {item.allergies ? (
                          <Text style={styles.needsLabel}>
                            Allergies: <Text style={styles.needsValue}>{item.allergies}</Text>
                          </Text>
                        ) : null}

                        {item.otherInfo ? (
                          <Text style={styles.needsLabel}>
                            Other info: <Text style={styles.needsValue}>{item.otherInfo}</Text>
                          </Text>
                        ) : null}

                        {!item.allergies && !item.otherInfo ? (
                          <Text style={styles.noNeedsText}>No information added</Text>
                        ) : null}
                      </View>

                      <View style={styles.cardEditButton}>
                        <AppButton
                          label="Edit"
                          variant="edit"
                          onPress={() => startEditing(item)}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              )}
            </>
          )}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef5fb',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    textAlign: 'center',
    color: '#090909',
  },
  titleDivider: {
    height: 3,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 28,
    marginHorizontal: 28,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#cccccc',
    borderRadius: 999,
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#090909',
    marginBottom: 12,
  },
  tripCard: {
    backgroundColor: '#ddeaf7',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  tripName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#090909',
    marginBottom: 6,
  },
  needsLabel: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  needsValue: {
    fontWeight: '400',
    color: '#111111',
  },
  noNeedsText: {
    fontSize: 14,
    color: '#777777',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  editButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardEditButton: {
    alignSelf: 'center',
  },
  cancelButton: {
    backgroundColor: '#e8ecf1',
  },
  cancelButtonText: {
    color: '#333333',
  },
  sectionNote: {
    fontSize: 13,
    color: '#777777',
    fontStyle: 'italic',
    marginBottom: 14,
  },
});
