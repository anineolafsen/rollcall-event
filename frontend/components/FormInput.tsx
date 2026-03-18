import { View, Text, StyleSheet, TextInput, TextInputProps } from 'react-native';

// Define the props that can be passed to FormInput
interface FormInputProps extends TextInputProps {
  // Required props
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  
  // Optional props with defaults
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  placeholderTextColor?: string;
}

/**
 * FormInput Component
 * A reusable form input field component that handles common input styling and layout
 * 
 * Usage:
 * <FormInput
 *   label="Trip Name"
 *   placeholder="Enter trip name..."
 *   value={name}
 *   onChangeText={setName}
 *   keyboardType="default"
 * />
 */
export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder = '',
  keyboardType = 'default',
  placeholderTextColor = '#8b8b8b',
  ...otherProps
}: FormInputProps) {
  return (
    <View style={styles.section}>
      {/* Label text */}
      <Text style={styles.label}>{label}</Text>
      
      {/* TextInput field - all styling is centralized here */}
      <TextInput
        style={styles.inputBox}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        {...otherProps}
      />
    </View>
  );
}

// Centralized styles for all form inputs
const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  
  inputBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    color: '#000',
    fontSize: 15,
  },
});
