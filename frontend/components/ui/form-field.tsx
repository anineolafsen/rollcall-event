import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle } from 'react-native';

type FormFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText?: (value: string) => void;
  error?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
  editable?: boolean;
  onPress?: () => void;
  rightAdornment?: ReactNode;
  inputStyle?: StyleProp<TextStyle>;
  highlightColor?: string; // NEW
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
  onPress,
  rightAdornment,
  inputStyle,
  highlightColor, // NEW
}: FormFieldProps) {
  const isPressable = typeof onPress === 'function';

  const inputElement = (
    <View style={styles.inputWrapper}>
      <TextInput
        editable={editable && !isPressable}
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
          rightAdornment ? styles.inputWithAdornment : undefined,
          error ? styles.inputError : undefined,
          highlightColor ? { borderColor: highlightColor } : undefined, // NEW
          inputStyle,
        ]}
        value={value}
      />
      {rightAdornment ? <View style={styles.adornment}>{rightAdornment}</View> : null}
    </View>
  );

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}:</Text>
      {isPressable ? (
        <Pressable onPress={onPress} style={styles.pressableField}>
          {inputElement}
        </Pressable>
      ) : (
        inputElement
      )}
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
  pressableField: {
    borderRadius: 12,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9e1df',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111111',
  },
  inputWithAdornment: {
    paddingRight: 44,
  },
  inputDisabled: {
    backgroundColor: '#f2f2f2',
    color: '#8d8d8d',
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  adornment: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
