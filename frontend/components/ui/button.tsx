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
      style={({ pressed }) => [
        styles.button,
        variant === 'create' ? styles.createButton : undefined,
        variant === 'edit' ? styles.editButton : undefined,
        variant === 'delete' ? styles.deleteButton : undefined,
        disabled ? styles.buttonDisabled : (pressed ? styles.buttonPressed : undefined),
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
});
