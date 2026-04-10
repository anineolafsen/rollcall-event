import { StyleSheet, Text, TextInput, View, Platform } from 'react-native';

type FormFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
  editable?: boolean;
  inputType?: 'text' | 'date';
};

export function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  multiline = false,
  keyboardType = 'default',
  editable = true,
  inputType = 'text',
}: FormFieldProps) {

  const dateToHtmlFormat = (dateStr: string): string => {
    const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  };

  const htmlDateToFormFormat = (dateStr: string): string => {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}.${month}.${year}`;
    }
    return dateStr;
  };

  const handleDateChange = (htmlDate: string) => {
    const formatted = htmlDateToFormFormat(htmlDate);
    onChangeText(formatted);
  };

  if (Platform.OS === 'web' && inputType === 'date') {
    const htmlDateValue = dateToHtmlFormat(value);
    
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}:</Text>
        <input
          type="date"
          lang="en"
          value={htmlDateValue}
          onChange={(e) => handleDateChange(e.currentTarget.value)}
          disabled={!editable}
          placeholder={placeholder}
          style={{
            minHeight: '48px',
            borderRadius: '12px',
            backgroundColor: editable ? '#fbf5f4' : '#f2f2f2',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: error ? '#d95c5c' : '#e9e1df',
            paddingLeft: '14px',
            paddingRight: '14px',
            paddingTop: '12px',
            paddingBottom: '12px',
            fontSize: '16px',
            color: editable ? '#111111' : '#8d8d8d',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: '400',
            cursor: editable ? 'pointer' : 'not-allowed',
            boxSizing: 'border-box',
          } as any}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  // Default: React Native TextInput
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}:</Text>
      <TextInput
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#b8bcc2"
        style={[
          styles.input,
          multiline ? styles.multilineInput : undefined,
          !editable ? styles.inputDisabled : undefined,
          error ? styles.inputError : undefined,
        ]}
        value={value}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 10,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#fbf5f4',
    borderWidth: 1,
    borderColor: '#e9e1df',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111111',
  },
  inputDisabled: {
    backgroundColor: '#f2f2f2',
    color: '#8d8d8d',
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#d95c5c',
  },
  errorText: {
    color: '#c04343',
    marginTop: 8,
    fontSize: 14,
  },
});
