// components/AuthButton.tsx
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface AuthButtonProps {
  title: string;
  onPress: () => void;
}

export default function AuthButton({ title, onPress }: AuthButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4f46e5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});