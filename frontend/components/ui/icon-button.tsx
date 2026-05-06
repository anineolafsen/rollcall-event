import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type IconButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  renderIcon: (color: string) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
  size?: number;
};

export function IconButton({
  onPress,
  accessibilityLabel,
  renderIcon,
  style,
  size = 40,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: Math.max(10, Math.round(size * 0.24)),
        },
        hovered && styles.buttonHovered,
        pressed && styles.buttonPressed,
        style,
      ]}>
      {({ hovered }) => renderIcon(hovered ? '#ffffff' : '#4a7ca8')}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#4a7ca8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4a7ca8',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonHovered: {
    backgroundColor: '#4a7ca8',
    borderColor: '#4a7ca8',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
