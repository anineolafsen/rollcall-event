import { useState } from 'react';
import { useRouter } from 'expo-router';
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

// Helper: Validate and parse date from DD.MM.YYYY format
const parseDate = (dateStr: string): Date | null => {
  const trimmed = dateStr.trim();
  // Try DD.MM.YYYY format
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    // Validate that the date is valid (e.g., not Feb 30)
    if (date.getDate() === parseInt(day)) {
      return date;
    }
    return null;
  }
  
  // Try ISO format (YYYY-MM-DD)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (date.getDate() === parseInt(day)) {
      return date;
    }
    return null;
  }
  
  return null;
};

// Helper: Format date to ISO string (backend expects this)
const formatDateToISO = (dateStr: string): string | null => {
  const date = parseDate(dateStr);
  if (!date) return null;
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

const initialFormValues: FormValues = {
  title: '',
  destination: '',
  dateFrom: '',
  dateTo: '',
  description: '',
};

export function CreateTripScreen() {
    const router = useRouter();

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
    } else {
      const startDate = parseDate(formValues.dateFrom);
      if (!startDate) {
        nextErrors.dateFrom = 'Invalid date format. Use DD.MM.YYYY (e.g., 15.05.2026).';
      }
    }

    if (!formValues.dateTo.trim()) {
      nextErrors.dateTo = 'Add an end date.';
    } else {
      const endDate = parseDate(formValues.dateTo);
      if (!endDate) {
        nextErrors.dateTo = 'Invalid date format. Use DD.MM.YYYY (e.g., 15.05.2026).';
      }
    }

    if (!nextErrors.dateFrom && !nextErrors.dateTo) {
      const startDate = parseDate(formValues.dateFrom)!;
      const endDate = parseDate(formValues.dateTo)!;
      if (endDate <= startDate) {
        nextErrors.dateTo = 'End date must be after start date.';
      }
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
      // Convert dates to ISO format for backend
      const startDateISO = formatDateToISO(formValues.dateFrom);
      const endDateISO = formatDateToISO(formValues.dateTo);

      if (!startDateISO || !endDateISO) {
        throw new Error('Failed to parse dates');
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL 
        ? `${process.env.EXPO_PUBLIC_API_URL}/api`
        : 'http://localhost:5118/api';

      const response = await fetch(`${apiUrl}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formValues.title,
          startDate: startDateISO,
          endDate: endDateISO,
          destination: formValues.destination,
          description: formValues.description,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Trip creation response:', result);
      setSuccessMessage('Trip created successfully!');
      // Navigate to invitations page with trip details
      const tripId = result.tripID || result.tripId || result.id || 1;
      console.log('Extracted tripId:', tripId);
      router.push({
        pathname: '/invitations',
        params: {
          tripId,
          tripName: formValues.title,
        },
      });
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
        
        {/* Trip Creation Form */}
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
                inputType="date"
              />
            </View>

            <View style={styles.rowField}>
              <FormField
                label="Date to"
                placeholder="DD.MM.YYYY"
                value={formValues.dateTo}
                onChangeText={(value) => updateField('dateTo', value)}
                error={formErrors.dateTo}
                inputType="date"
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
