import { useEffect, useRef } from 'react';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Platform, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/ui/form-field';
import { IconSymbol } from '@/components/ui/icon-symbol';

type DateFieldProps = {
  label: string;
  placeholder?: string;
  value: string;
  error?: string;
  minValue?: string;
  maxValue?: string;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
  onClose?: () => void;
};

const pad = (value: number) => String(value).padStart(2, '0');

export const formatDateValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const parseDateValue = (value: string) => {
  if (!value) {
    return new Date();
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/,
  );

  if (!match) {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }

  const [, year, month, day, hour = '00', minute = '00'] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
};

const formatDisplayValue = (value: string) => {
  if (!value) {
    return '';
  }

  const date = parseDateValue(value);

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export function DateField({
  label,
  placeholder = 'Select date and time',
  value,
  error,
  minValue,
  maxValue,
  isOpen,
  onToggle,
  onChange,
  onClose,
}: DateFieldProps) {
  const webInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && isOpen) {
      const input = webInputRef.current;

      if (!input) {
        return;
      }

      if (typeof input.showPicker === 'function') {
        input.showPicker();
      } else {
        input.focus();
        input.click();
      }

      return;
    }

    if (Platform.OS === 'android' && isOpen) {
      const currentValue = parseDateValue(value);

      DateTimePickerAndroid.open({
        value: currentValue,
        mode: 'date',
        minimumDate: minValue ? parseDateValue(minValue) : undefined,
        maximumDate: maxValue ? parseDateValue(maxValue) : undefined,
        is24Hour: true,
        onChange: (dateEvent: DateTimePickerEvent, selectedDate?: Date) => {
          if (dateEvent.type === 'dismissed' || !selectedDate) {
            onClose?.();
            return;
          }

          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: 'time',
            is24Hour: true,
            onChange: (timeEvent: DateTimePickerEvent, selectedTime?: Date) => {
              onClose?.();

              if (timeEvent.type === 'dismissed' || !selectedTime) {
                return;
              }

              const nextDate = new Date(selectedDate);
              nextDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
              onChange(formatDateValue(nextDate));
            },
          });
        },
      });
    }
  }, [isOpen, maxValue, minValue, onChange, onClose, value]);

  const handleIosChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      onClose?.();
      return;
    }

    if (!selectedDate) {
      return;
    }

    onChange(formatDateValue(selectedDate));
  };

  return (
    <View style={styles.container}>
      <FormField
        label={label}
        placeholder={placeholder}
        value={formatDisplayValue(value)}
        onPress={onToggle}
        error={error}
        rightAdornment={<IconSymbol name="calendar" size={18} color="#5f84a3" />}
      />

      {Platform.OS === 'web' ? (
        <input
          ref={webInputRef}
          aria-label={label}
          max={maxValue}
          min={minValue}
          onBlur={() => onClose?.()}
          onChange={(event) => {
            onChange(event.currentTarget.value);
            onClose?.();
          }}
          step={60}
          style={webHiddenInputStyle}
          type="datetime-local"
          value={value}
        />
      ) : Platform.OS === 'ios' && isOpen ? (
        <View style={styles.pickerCard}>
          <DateTimePicker
            display="inline"
            maximumDate={maxValue ? parseDateValue(maxValue) : undefined}
            minimumDate={minValue ? parseDateValue(minValue) : undefined}
            mode="datetime"
            onChange={handleIosChange}
            value={parseDateValue(value)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pickerCard: {
    marginTop: -4,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d6e4f0',
    backgroundColor: '#fbfdff',
    padding: 8,
  },
});

const webHiddenInputStyle = {
  position: 'absolute',
  top: 52,
  right: 14,
  width: 24,
  height: 24,
  opacity: 0,
} as const;
