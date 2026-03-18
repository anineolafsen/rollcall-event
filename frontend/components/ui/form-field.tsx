import { StyleSheet, Text, TextInput, View } from 'react-native';

type FormFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
  editable?: boolean;
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
}: FormFieldProps) {
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
