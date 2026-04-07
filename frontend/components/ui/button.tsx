import { Pressable, StyleSheet, Text } from 'react-native';

type AppButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
};

export function AppButton({ label, onPress, disabled = false }: AppButtonProps) {
  return (
    <Pressable 
      onPress={onPress} 
      disabled={disabled}
      style={({ pressed }) => [
        styles.button, 
        disabled ? styles.buttonDisabled : (pressed ? styles.buttonPressed : undefined)
      ]}
    >
      <Text style={[styles.label, disabled ? styles.labelDisabled : undefined]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#0b0b0b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  labelDisabled: {
    color: '#cccccc',
  },
});
