import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    setSuccessMessage('Trip draft is ready. Connect this form to the backend create endpoint next.');
    Alert.alert('Trip created', 'The frontend form is complete and ready to connect to real data.');
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
                placeholder="YYYY-MM-DD"
                value={formValues.dateFrom}
                onChangeText={(value) => updateField('dateFrom', value)}
                error={formErrors.dateFrom}
              />
            </View>

            <View style={styles.rowField}>
              <FormField
                label="Date to"
                placeholder="YYYY-MM-DD"
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

          <AppButton label="Create trip" onPress={handleSubmit} />
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
