// components/AuthInput.tsx
import { TextInput, StyleSheet, TextInputProps } from "react-native";

interface AuthInputProps extends TextInputProps {
  // Add any custom props here if needed, but for now it's just TextInputProps
}

export default function AuthInput(props: AuthInputProps) {
  return (
    <TextInput
      style={styles.input}
      placeholderTextColor="#888"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },
});