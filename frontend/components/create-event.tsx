import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAuth } from "@clerk/expo";

import { AppButton } from '@/components/ui/button';
import { DateField, formatDateValue, parseDateValue } from '@/components/ui/date-field';
import { FormField } from '@/components/ui/form-field';
import { SelectionChip } from '@/components/ui/selection-chip';
import { createEvent, getEventById, updateEvent, type AttendanceMode, type EventPayload } from '@/lib/events';
import { checkinService } from '@/services/checkinService';

type FormValues = {
  title: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  description: string;
  capacity: string;
  hasUnlimitedCapacity: boolean;
  attendanceMode: AttendanceMode;
  isEmergency: boolean;
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
  isEmergency: false,
};

type DateFieldName = 'dateFrom' | 'dateTo';

export function CreateEventScreen() {
  const { id, tripId, emergency } = useLocalSearchParams<{ id?: string; tripId?: string; emergency?: string; }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { width } = useWindowDimensions();

  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [activeDateField, setActiveDateField] = useState<DateFieldName | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [eventTripId, setEventTripId] = useState<number | null>(tripId ? Number(tripId) : null);
  const minimumStartValue = formatDateValue(new Date());
  const isEditing = Boolean(id);
  const showDesktopBackButton = Platform.OS === 'web' && width >= 900;
  const isMobileLayout = !showDesktopBackButton;
  const eventsRoute = eventTripId
    ? {
        pathname: '/trips/[id]/events' as const,
        params: { id: String(eventTripId) },
      }
    : null;

  const isEmergency = emergency === 'true' || formValues.isEmergency || isLoadingEvent;

    useEffect(() => {
    if (!isEmergency) return;

    const now = new Date();
    const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    setFormValues({
      title: '',
      location: '',
      description: '',
      dateFrom: formatDateValue(now),
      dateTo: formatDateValue(inThreeHours),
      capacity: '',
      hasUnlimitedCapacity: true,
      attendanceMode: 'mandatory',
      isEmergency: true,
    });
  }, [isEmergency]);


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

  const fetchEvent = useCallback(async () => {
    if (!id) return;

    setIsLoadingEvent(true);
    try {
      const token = await getToken({ template: "RollCallAuth" });
      const event = await getEventById(id, token);
      setEventTripId(event.tripId);
      setFormValues({
        title: event.name ?? '',
        location: event.location ?? '',
        dateFrom: event.startDate ?? '',
        dateTo: event.endDate ?? '',
        description: event.description ?? '',
        capacity: event.capacity ? String(event.capacity) : '',
        hasUnlimitedCapacity: Boolean(event.hasUnlimitedCapacity),
        attendanceMode: event.attendanceMode === 'signup-required' ? 'signup-required' : 'mandatory',
        isEmergency: Boolean(event.isEmergency),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load event';
      Alert.alert('Error', errorMessage);
      router.back();
    } finally {
      setIsLoadingEvent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

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

    if (!isEmergency && !formValues.title.trim()) {
      nextErrors.title = 'Add an event name.';
    }

    if (!isEmergency && !formValues.location.trim()) {
      nextErrors.location = 'Add a location.';
    }

    /*if (!formValues.description.trim()) {
      nextErrors.description = 'Add a short description.';
    }*/

    if (!isEmergency) {
      if (!formValues.dateFrom.trim()) {
        nextErrors.dateFrom = 'Add a start date.';
      }

      if (!formValues.dateTo.trim()) {
        nextErrors.dateTo = 'Add an end date.';
      }

      Object.assign(nextErrors, getDateErrors(formValues));

      if (!formValues.hasUnlimitedCapacity && !formValues.capacity.trim()) {
        nextErrors.capacity = 'Add a participant limit or choose no limitation.';
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
      console.log('handleSubmit fired', { eventTripId, formValues });
    if (!eventTripId || Number.isNaN(eventTripId)) {
      Alert.alert('Error', 'Create events from a trip so the event is linked correctly.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken({ template: "RollCallAuth" });

      const payload: EventPayload = {
        name: formValues.title,
        location: formValues.location,
        startDate: formValues.dateFrom,
        endDate: formValues.dateTo,
        description: formValues.description,
        capacity: formValues.hasUnlimitedCapacity ? null : Number(formValues.capacity),
        hasUnlimitedCapacity: formValues.hasUnlimitedCapacity,
        attendanceMode: formValues.attendanceMode,
        isEmergency: formValues.isEmergency,
        tripId: eventTripId,
      };

      if (isEditing) {
        await updateEvent(id!, payload, token);
        Alert.alert('Success', 'Event updated successfully!');
        router.replace(`/trips/${eventTripId}`);
      } else {
        const createdEvent = await createEvent(payload, token);

        if (payload.isEmergency && createdEvent?.id) {
          await checkinService.startSession(createdEvent.id, 'self', 180, token);
          router.replace(`/trips/${eventTripId}`);
        } else {
          Alert.alert('Success', 'Event created successfully!');
          router.replace(`/trips/${eventTripId}`);
        }
      }

      setFormValues(initialFormValues);
      setFormErrors({});
      setActiveDateField(null);
      Alert.alert('Success', isEditing ? 'Event updated successfully!' : 'Event created successfully!');
      router.replace(`/trips/${eventTripId}`);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : isEditing
          ? 'Failed to update event'
          : 'Failed to save event';
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
        <View style={[styles.content, isMobileLayout && styles.mobileContent]}>
          {showDesktopBackButton ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (eventsRoute) {
                  router.replace(eventsRoute);
                  return;
                }

                router.back();
              }}>
              <Text style={styles.backButtonText}>← Go back</Text>
            </TouchableOpacity>
          ) : null}

          <Text
            style={[
              styles.title,
              isEmergency ? styles.emergencyTitle : styles.normalTitle,
            ]}
          >
            {isEmergency ? 'Emergency Event' : isEditing ? 'Edit Event' : 'Create New Event'}
          </Text>
          <View style={styles.titleDivider} />

          {isLoadingEvent ? <Text style={styles.helperText}>Loading event details...</Text> : null}
          
          {!isEmergency && (
          <>
          <FormField
            label={isEmergency ? "Emergency Name" : "Name of Event"}
            placeholder={isEmergency ? "Add emergency name" : "Add event name"}
            value={formValues.title}
            onChangeText={(value) => updateField('title', value)}
            error={formErrors.title}
            highlightColor={isEmergency ? '#c92a2a' : undefined}
          />
          </>)}

          <FormField
            label={isEmergency ? "Assembly Point" : "Location"}
            placeholder={isEmergency ? 'Add assembly point' : 'Add location'}
            value={formValues.location}
            onChangeText={(value) => updateField('location', value)}
            error={formErrors.location}
            highlightColor={isEmergency ? '#c92a2a' : undefined}
          />

          <FormField
            label="Description"
            placeholder="Add a short event description"
            value={formValues.description}
            onChangeText={(value) => updateField('description', value)}
            error={formErrors.description}
            multiline
            highlightColor={isEmergency ? '#c92a2a' : undefined}
          />

        {/* Only show extra fields if NOT emergency */}
        {!isEmergency && (
          <>
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
            </>
          )}

          {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}

          <AppButton
            variant={isEmergency ? undefined : 'edit'}
            label={
              isSubmitting
                ? isEditing ? 'Saving event...' : 'Creating event...'
                : isEditing ? 'Save changes' : isEmergency ? 'Create Emergency Event' : 'Create event'
            }
            onPress={handleSubmit}
            disabled={isSubmitting || isLoadingEvent}
            style={isEmergency ? [styles.emergencyButton] : undefined}
            textStyle={isEmergency ? [styles.emergencyLabel] : undefined}
          />
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    backgroundColor: '#eef5fb',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 80,
  },
  mobileContent: {
    paddingHorizontal: 22,
    paddingTop: 64,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    textAlign: 'center',
    // color will be set dynamically
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
    marginBottom: 12,
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
  emergencyTitle: {
    color: '#c92a2a',
  },
  normalTitle: {
    color: '#090909',
  },
  emergencyButton: {
    backgroundColor: '#c92a2a',
    borderWidth: 1.5,
    borderColor: '#c92a2a',
  },
  emergencyLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
