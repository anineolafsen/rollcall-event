import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

type AppButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'default' | 'create' | 'edit' | 'delete';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function AppButton({
  label,
  onPress,
  disabled = false,
  variant = 'default',
  style,
  textStyle,
}: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ hovered, pressed }) => [
        styles.button,
        variant === 'create' ? styles.createButton : undefined,
        variant === 'edit' ? styles.editButton : undefined,
        variant === 'delete' ? styles.deleteButton : undefined,
        disabled ? styles.buttonDisabled : (hovered ? styles.buttonHovered : undefined),
        disabled ? undefined : (pressed ? styles.buttonPressed : undefined),
        style,
      ]}>
      <Text
        style={[
          styles.label,
          variant === 'create' ? styles.createLabel : undefined,
          variant === 'edit' ? styles.actionLabel : undefined,
          variant === 'delete' ? styles.actionLabel : undefined,
          disabled ? styles.labelDisabled : undefined,
          textStyle,
        ]}>
        {label}
      </Text>
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  createButton: {
    borderRadius: 18,
    minHeight: 66,
    paddingHorizontal: 28,
    paddingVertical: 18,
    backgroundColor: '#050505',
  },
  editButton: {
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: '#76b6ee',
    paddingHorizontal: 18,
  },
  deleteButton: {
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: '#d65c5c',
    paddingHorizontal: 18,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonHovered: {
    borderColor: 'rgba(74, 124, 168, 0.45)',
    shadowColor: '#2a4f73',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    transform: [{ translateY: -1 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  createLabel: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  labelDisabled: {
    color: '#cccccc',
  },
  emergencyButton: {
    borderRadius: 18,
    minHeight: 66,
    paddingHorizontal: 28,
    paddingVertical: 18,
    backgroundColor: '#ffeaea', // light red
    borderWidth: 2,
    borderColor: '#c92a2a', // red
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyLabel: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    color: '#c92a2a',
  },
});
