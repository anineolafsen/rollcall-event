import { useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';

type FormValues = {
  title: string;
  destination: string;
  dateFrom: string;
  dateTo: string;
  description: string;
};

type FormErrors = Partial<Record<'title' | 'destination' | 'dateFrom' | 'dateTo' | 'description', string>>;

const initialFormValues: FormValues = {
  title: '',
  destination: '',
  dateFrom: '',
  dateTo: '',
  description: '',
};

export function CreateTripScreen() {
    const router = useRouter();
    const pathname = usePathname();

  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));

    setSuccessMessage('');
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!formValues.title.trim()) {
      nextErrors.title = 'Add a trip name.';
    }

    if (!formValues.destination.trim()) {
      nextErrors.destination = 'Add a destination.';
    }

    if (!formValues.dateFrom.trim()) {
      nextErrors.dateFrom = 'Add a start date.';
    }

    if (!formValues.dateTo.trim()) {
      nextErrors.dateTo = 'Add an end date.';
    }

    if (!formValues.description.trim()) {
      nextErrors.description = 'Add a short description.';
    }

    setFormErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5118/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formValues.title,
          startDate: formValues.dateFrom,
          endDate: formValues.dateTo,
          destination: formValues.destination,
          description: formValues.description,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSuccessMessage('Trip created successfully!');
      setFormValues(initialFormValues);
      Alert.alert('Success', 'Trip has been created and saved to the database.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trip';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Go back</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Create New Trip</Text>
          <View style={styles.titleDivider} />

          <FormField
            label="Trip Name"
            placeholder="Add trip name"
            value={formValues.title}
            onChangeText={(value) => updateField('title', value)}
            error={formErrors.title}
          />

          <FormField
            label="Destination"
            placeholder="Add destination"
            value={formValues.destination}
            onChangeText={(value) => updateField('destination', value)}
            error={formErrors.destination}
          />

          <View style={styles.row}>
            <View style={styles.rowField}>
              <FormField
                label="Date from"
                placeholder="DD.MM.YYYY"
                value={formValues.dateFrom}
                onChangeText={(value) => updateField('dateFrom', value)}
                error={formErrors.dateFrom}
              />
            </View>

            <View style={styles.rowField}>
              <FormField
                label="Date to"
                placeholder="DD.MM.YYYY"
                value={formValues.dateTo}
                onChangeText={(value) => updateField('dateTo', value)}
                error={formErrors.dateTo}
              />
            </View>
          </View>

          <FormField
            label="Description"
            placeholder="Add a short trip description"
            value={formValues.description}
            onChangeText={(value) => updateField('description', value)}
            error={formErrors.description}
            multiline
          />

          {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}

          <AppButton label={isLoading ? 'Creating trip...' : 'Create trip'} onPress={handleSubmit} disabled={isLoading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f1ec',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#eef5fb',
    paddingHorizontal: 22,
    paddingTop: 80,
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
  backButton: {
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 15,
    color: '#4a7ca8',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  successMessage: {
    marginBottom: 16,
    color: '#246b3f',
    fontSize: 14,
    lineHeight: 20,
  },
});
