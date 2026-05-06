import { View, TextInput, StyleSheet, Platform } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface AuthInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad";
}

export default function AuthInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType = "default",
}: AuthInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
            color: isDark ? "#fff" : "#111827",
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#e5e7eb",
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#9ca3af" : "#9ca3af"}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    width: "100%",
  },
  input: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15.5,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      } as any,
    }),
  },
});
