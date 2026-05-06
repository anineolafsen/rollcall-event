import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@clerk/expo';

import { AppButton } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type Props = {
  visible: boolean;
  tripId: number | null;
  onClose: () => void;
};

export function TripNeedsModal({ visible, tripId, onClose }: Props) {
  const { getToken } = useAuth();
  const [allergies, setAllergies] = useState('');
  const [otherInfo, setOtherInfo] = useState('');
  const [saving, setSaving] = useState(false);

  const saveNeeds = async (allergiesValue: string | null, otherInfoValue: string | null) => {
    if (!tripId) return;
    setSaving(true);
    try {
      const token = await getToken({ template: 'RollCallAuth' });
      await fetch(`${API_BASE_URL}/api/participants/${tripId}/needs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ allergies: allergiesValue, otherInfo: otherInfoValue }),
      });
    } catch (error) {
      console.error('Error saving trip needs:', error);
    } finally {
      setSaving(false);
      setAllergies('');
      setOtherInfo('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>You joined the trip!</Text>
            <View style={styles.titleDivider} />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                This information helps us ensure your safety during the trip (e.g. allergies or accessibility needs).
              </Text>
              <View style={styles.infoDivider} />
              <Text style={styles.infoText}>It is only visible to organizers and will be deleted when the trip is finished.</Text>
              <View style={styles.infoDivider} />
              <Text style={styles.infoText}>You can view and update this at any time from your profile page.</Text>
            </View>

            <FormField
              label="Allergies"
              placeholder="E.g. nuts, gluten, shellfish"
              value={allergies}
              onChangeText={setAllergies}
              multiline
            />

            <FormField
              label="Other needs or important information"
              placeholder="E.g. wheelchair access, medication"
              value={otherInfo}
              onChangeText={setOtherInfo}
              multiline
            />

            <View style={styles.buttonRow}>
              <View style={{ flex: 1 }}>
                <AppButton
                  label="Skip"
                  onPress={() => saveNeeds(null, null)}
                  disabled={saving}
                  style={styles.skipButton}
                  textStyle={styles.skipButtonText}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  label="Save"
                  onPress={() => saveNeeds(allergies || null, otherInfo || null)}
                  disabled={saving}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalContainer: {
    backgroundColor: '#eef5fb',
    borderRadius: 24,
    maxHeight: '90%',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#090909',
  },
  titleDivider: {
    height: 3,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 24,
    marginHorizontal: 28,
  },
  infoBox: {
    backgroundColor: '#ddeaf7',
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#b8d4ec',
    marginVertical: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#2a4a6b',
    lineHeight: 19,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  skipButton: {
    backgroundColor: '#e8ecf1',
  },
  skipButtonText: {
    color: '#333333',
  },
});
