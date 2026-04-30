import { useAuth } from '@clerk/expo';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL}/api`
  : 'http://localhost:5118/api';

type TripDetails = {
  id: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
};

type TripDescriptionEditorProps = {
  trip: TripDetails;
  onSaved?: (description: string) => void;
};

export default function TripDescriptionEditor({
  trip,
  onSaved,
}: TripDescriptionEditorProps) {
  const { getToken } = useAuth();
  const [description, setDescription] = useState(trip.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setDescription(trip.description);
  }, [trip.description]);

  const handleSave = async () => {
    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setError('Add a short description.');
      setSuccessMessage('');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const token = await getToken({ template: 'RollCallAuth' });
      const response = await fetch(`${API_BASE_URL}/trips/${trip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: trip.name,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          description: trimmedDescription,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save trip (${response.status})`);
      }

      setDescription(trimmedDescription);
      setSuccessMessage('Description updated.');
      onSaved?.(trimmedDescription);
    } catch {
      setError('Could not save trip description.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.fieldWrapper}>
        <FormField
          label="Trip description"
          placeholder="Add a short trip description"
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            setError(null);
            setSuccessMessage('');
          }}
          error={error ?? undefined}
          multiline
          inputStyle={styles.descriptionInput}
        />
      </View>
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
      <AppButton
        label={saving ? 'Saving changes...' : 'Save changes'}
        onPress={handleSave}
        disabled={saving}
        variant="edit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d9e8f5',
    padding: 20,
    minHeight: 320,
  },
  fieldWrapper: {
    minHeight: 210,
  },
  descriptionInput: {
    minHeight: 220,
  },
  successText: {
    marginBottom: 16,
    color: '#246b3f',
    fontSize: 14,
    lineHeight: 20,
  },
});
