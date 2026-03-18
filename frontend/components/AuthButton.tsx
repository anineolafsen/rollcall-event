// components/AuthButton.tsx
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  type TouchableOpacityProps,
} from "react-native";

type AuthButtonProps = {
  title: string;
  onPress?: TouchableOpacityProps["onPress"];
};

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
