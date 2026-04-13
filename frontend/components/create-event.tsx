import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/button';
import { DateField, formatDateValue, parseDateValue } from '@/components/ui/date-field';
import { FormField } from '@/components/ui/form-field';
import { SelectionChip } from '@/components/ui/selection-chip';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

type AttendanceMode = 'mandatory' | 'signup-required';

type FormValues = {
  title: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  description: string;
  capacity: string;
  hasUnlimitedCapacity: boolean;
  attendanceMode: AttendanceMode;
};

type FormErrors = Partial<Record<'title' | 'location' | 'dateFrom' | 'dateTo' | 'description' | 'capacity', string>>;

const initialFormValues: FormValues = {
  title: '',
  location: '',
  dateFrom: '',
  dateTo: '',
  description: '',
  capacity: '',
  hasUnlimitedCapacity: false,
  attendanceMode: 'mandatory',
};

type DateFieldName = 'dateFrom' | 'dateTo';

export function CreateEventScreen() {
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [activeDateField, setActiveDateField] = useState<DateFieldName | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const minimumStartValue = formatDateValue(new Date());

  const capacityHint = formValues.hasUnlimitedCapacity
    ? 'No participant limit is set for this event.'
    : formValues.capacity
      ? `This event will allow up to ${formValues.capacity} participants.`
      : '';

  const getDateErrors = (values: Pick<FormValues, 'dateFrom' | 'dateTo'>) => {
    const nextErrors: Pick<FormErrors, 'dateFrom' | 'dateTo'> = {};
    const now = new Date();

    if (values.dateFrom) {
      const startDate = parseDateValue(values.dateFrom);

      if (startDate < now) {
        nextErrors.dateFrom = 'Start date and time cannot be in the past.';
      }
    }

    if (values.dateFrom && values.dateTo) {
      const startDate = parseDateValue(values.dateFrom);
      const endDate = parseDateValue(values.dateTo);

      if (endDate < startDate) {
        nextErrors.dateTo = 'End date and time cannot be earlier than the start date and time.';
      }
    }

    return nextErrors;
  };

  const updateDateField = (field: DateFieldName, value: string) => {
    setFormValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [field]: value,
      };

      if (
        field === 'dateFrom' &&
        nextValues.dateTo &&
        parseDateValue(nextValues.dateTo) < parseDateValue(value)
      ) {
        nextValues.dateTo = '';
      }

      return nextValues;
    });

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      dateFrom: undefined,
      dateTo: undefined,
      ...getDateErrors({
        dateFrom: field === 'dateFrom' ? value : formValues.dateFrom,
        dateTo:
          field === 'dateTo'
            ? value
            : field === 'dateFrom' && formValues.dateTo && parseDateValue(formValues.dateTo) < parseDateValue(value)
              ? ''
              : formValues.dateTo,
      }),
    }));

    setSuccessMessage('');
  };

  const updateField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    if (field !== 'attendanceMode' && field !== 'hasUnlimitedCapacity') {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
      }));
    }

    if (field === 'hasUnlimitedCapacity' && value === true) {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        capacity: undefined,
      }));
    }

    setSuccessMessage('');
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!formValues.title.trim()) {
      nextErrors.title = 'Add an event name.';
    }

    if (!formValues.location.trim()) {
      nextErrors.location = 'Add a location.';
    }

    if (!formValues.dateFrom.trim()) {
      nextErrors.dateFrom = 'Add a start date.';
    }

    if (!formValues.dateTo.trim()) {
      nextErrors.dateTo = 'Add an end date.';
    }

    Object.assign(nextErrors, getDateErrors(formValues));

    if (!formValues.description.trim()) {
      nextErrors.description = 'Add a short description.';
    }

    if (!formValues.hasUnlimitedCapacity && !formValues.capacity.trim()) {
      nextErrors.capacity = 'Add a participant limit or choose no limitation.';
    } else if (!formValues.hasUnlimitedCapacity) {
      const parsedCapacity = Number(formValues.capacity);

      if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
        nextErrors.capacity = 'Capacity must be a whole number above 0.';
      }
    }

    setFormErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleUnlimitedCapacityToggle = () => {
    const nextValue = !formValues.hasUnlimitedCapacity;

    updateField('hasUnlimitedCapacity', nextValue);

    if (nextValue) {
      updateField('capacity', '');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formValues.title,
          location: formValues.location,
          startDate: formValues.dateFrom,
          endDate: formValues.dateTo,
          description: formValues.description,
          capacity: formValues.hasUnlimitedCapacity ? null : Number(formValues.capacity),
          hasUnlimitedCapacity: formValues.hasUnlimitedCapacity,
          attendanceMode: formValues.attendanceMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();
      setSuccessMessage('Event created successfully!');
      setFormValues(initialFormValues);
      setFormErrors({});
      setActiveDateField(null);
      Alert.alert('Success', 'Event created successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save event';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDatePicker = (field: DateFieldName) => {
    setActiveDateField((currentField) => (currentField === field ? null : field));
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
          <Text style={styles.title}>Create New Event</Text>
          <View style={styles.titleDivider} />

          <FormField
            label="Name of Event"
            placeholder="Add event name"
            value={formValues.title}
            onChangeText={(value) => updateField('title', value)}
            error={formErrors.title}
          />

          <FormField
            label="Where"
            placeholder="Add location"
            value={formValues.location}
            onChangeText={(value) => updateField('location', value)}
            error={formErrors.location}
          />

          <View style={styles.row}>
            <View style={styles.rowField}>
              <DateField
                label="Date and time from"
                value={formValues.dateFrom}
                minValue={minimumStartValue}
                onToggle={() => toggleDatePicker('dateFrom')}
                onChange={(value) => updateDateField('dateFrom', value)}
                onClose={() => setActiveDateField(null)}
                isOpen={activeDateField === 'dateFrom'}
                error={formErrors.dateFrom}
              />
            </View>

            <View style={styles.rowField}>
              <DateField
                label="Date and time to"
                value={formValues.dateTo}
                minValue={formValues.dateFrom || minimumStartValue}
                onToggle={() => toggleDatePicker('dateTo')}
                onChange={(value) => updateDateField('dateTo', value)}
                onClose={() => setActiveDateField(null)}
                isOpen={activeDateField === 'dateTo'}
                error={formErrors.dateTo}
              />
            </View>
          </View>

          <FormField
            label="Description"
            placeholder="Add a short event description"
            value={formValues.description}
            onChangeText={(value) => updateField('description', value)}
            error={formErrors.description}
            multiline
          />

          <FormField
            label="Participant capacity"
            placeholder={formValues.hasUnlimitedCapacity ? 'No limitation selected' : 'e.g. 35'}
            value={formValues.capacity}
            onChangeText={(value) => updateField('capacity', value.replace(/[^0-9]/g, ''))}
            error={formErrors.capacity}
            keyboardType="number-pad"
            editable={!formValues.hasUnlimitedCapacity}
          />

          <Pressable onPress={handleUnlimitedCapacityToggle} style={styles.checkboxRow}>
            <View
              style={[
                styles.checkbox,
                formValues.hasUnlimitedCapacity ? styles.checkboxChecked : undefined,
              ]}>
              {formValues.hasUnlimitedCapacity ? <View style={styles.checkboxInner} /> : null}
            </View>
            <Text style={styles.checkboxLabel}>No participant limitation</Text>
          </Pressable>

          <Text style={styles.helperText}>{capacityHint}</Text>

          <Text style={styles.sectionLabel}>Choose attendance type:</Text>
          <View style={styles.optionRow}>
            <SelectionChip
              label="Mandatory"
              selected={formValues.attendanceMode === 'mandatory'}
              onPress={() => updateField('attendanceMode', 'mandatory')}
            />
            <SelectionChip
              label="Sign-up required"
              selected={formValues.attendanceMode === 'signup-required'}
              onPress={() => updateField('attendanceMode', 'signup-required')}
            />
          </View>

          {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}

          <AppButton
            label={isSubmitting ? 'Creating event...' : 'Create event'}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#8db3d5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#76b6ee',
    borderColor: '#76b6ee',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1a3d5c',
    fontWeight: '500',
  },
  helperText: {
    marginBottom: 20,
    fontSize: 13,
    lineHeight: 18,
    color: '#5a7a94',
  },
  sectionLabel: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a3d5c',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  successMessage: {
    marginBottom: 16,
    color: '#246b3f',
    fontSize: 14,
    lineHeight: 20,
  },
});
