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
import { FormField } from '@/components/ui/form-field';
import { SelectionChip } from '@/components/ui/selection-chip';

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

export function CreateEventScreen() {
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  const capacityHint = formValues.hasUnlimitedCapacity
    ? 'No participant limit is set for this event.'
    : formValues.capacity
      ? `This event will allow up to ${formValues.capacity} participants.`
      : 'Set a clear participant limit for planning and safety.';

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

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    setSuccessMessage('Event draft is ready. Connect this form to the backend create endpoint next.');
    Alert.alert('Event created', 'The frontend form is complete and ready to connect to real data.');
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

          <AppButton label="Create event" onPress={handleSubmit} />
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#b8c1c9',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#0b0b0b',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#0b0b0b',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#111111',
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#53616c',
    marginTop: 4,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  successMessage: {
    marginBottom: 16,
    color: '#246b3f',
    fontSize: 14,
    lineHeight: 20,
  },
});
