import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/button';
import { DateField, formatDateValue, parseDateValue } from '@/components/ui/date-field';
import { FormField } from '@/components/ui/form-field';
import { SelectionChip } from '@/components/ui/selection-chip';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

type AttendanceMode = 'mandatory' | 'signup-required';

type EventItem = {
  eventID: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  description?: string | null;
  capacity?: number | null;
  hasUnlimitedCapacity: boolean;
  attendanceMode: AttendanceMode;
};

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

const mapEventToFormValues = (event: EventItem): FormValues => ({
  title: event.name,
  location: event.location,
  dateFrom: event.startDate,
  dateTo: event.endDate,
  description: event.description ?? '',
  capacity: event.capacity ? String(event.capacity) : '',
  hasUnlimitedCapacity: event.hasUnlimitedCapacity,
  attendanceMode: event.attendanceMode,
});

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parseDateValue(value));

export function CreateEventScreen() {
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [activeDateField, setActiveDateField] = useState<DateFieldName | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingEvents, setIsFetchingEvents] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const minimumStartValue = formatDateValue(new Date());

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EventItem[] = await response.json();
      setEvents(data);
    } catch {
      Alert.alert('Error', 'Failed to load events.');
    } finally {
      setIsFetchingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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

      if (editingEventId === null && startDate < now) {
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

  const resetForm = () => {
    setFormValues(initialFormValues);
    setFormErrors({});
    setSuccessMessage('');
    setActiveDateField(null);
    setEditingEventId(null);
  };

  const handleEdit = (event: EventItem) => {
    setEditingEventId(event.eventID);
    setFormValues(mapEventToFormValues(event));
    setFormErrors({});
    setSuccessMessage('');
    setActiveDateField(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const isEditing = editingEventId !== null;
    const url = isEditing ? `${API_BASE_URL}/api/events/${editingEventId}` : `${API_BASE_URL}/api/events`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
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
      await fetchEvents();

      const nextMessage = isEditing ? 'Event updated successfully!' : 'Event created successfully!';
      setSuccessMessage(nextMessage);
      setFormValues(initialFormValues);
      setFormErrors({});
      setActiveDateField(null);
      setEditingEventId(null);
      Alert.alert('Success', nextMessage);
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
          <Text style={styles.title}>{editingEventId ? 'Edit Event' : 'Create New Event'}</Text>
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
            label={
              isSubmitting
                ? editingEventId
                  ? 'Saving event...'
                  : 'Creating event...'
                : editingEventId
                  ? 'Save changes'
                  : 'Create event'
            }
            onPress={handleSubmit}
            disabled={isSubmitting}
          />

          {editingEventId ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
              <Text style={styles.secondaryButtonText}>Cancel editing</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.eventsSection}>
            <Text style={styles.eventsSectionTitle}>Existing events</Text>
            <View style={styles.eventsDivider} />

            {isFetchingEvents ? (
              <Text style={styles.helperText}>Loading events...</Text>
            ) : events.length === 0 ? (
              <Text style={styles.helperText}>No events created yet.</Text>
            ) : (
              <View style={styles.eventsList}>
                {events.map((event) => (
                  <View key={event.eventID} style={styles.eventCard}>
                    <View style={styles.eventCardHeader}>
                      <View style={styles.eventCardBody}>
                        <Text style={styles.eventTitle}>{event.name}</Text>
                        <Text style={styles.eventMeta}>{formatDateTime(event.startDate)}</Text>
                        <Text style={styles.eventMeta}>{event.location}</Text>
                        {event.description ? (
                          <Text style={styles.eventDescription}>{event.description}</Text>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit(event)}>
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
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
  secondaryButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a7ca8',
  },
  eventsSection: {
    marginTop: 40,
  },
  eventsSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#090909',
    textAlign: 'center',
  },
  eventsDivider: {
    height: 2,
    backgroundColor: '#d9e8f5',
    borderRadius: 999,
    marginTop: 12,
    marginBottom: 20,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d9e8f5',
  },
  eventCardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  eventCardBody: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#090909',
    marginBottom: 6,
  },
  eventMeta: {
    fontSize: 13,
    color: '#4a7ca8',
    marginBottom: 4,
  },
  eventDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#5a7a94',
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#76b6ee',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
