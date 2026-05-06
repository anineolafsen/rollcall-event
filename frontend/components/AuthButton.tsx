import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface AuthButtonProps {
  title: string;
  onPress: () => void;
}

export default function AuthButton({ title, onPress }: AuthButtonProps) {
  return (
    <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4f46e5",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 7,
    marginBottom: 0,
    // Shadow for interactivity
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "700",
  },
});
