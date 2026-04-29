import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text } from 'react-native';

type TripActionButtonProps = {
  label?: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  backgroundColor?: string;
  textColor?: string;
};

export function TripActionButton({
  label,
  onPress,
  icon,
  backgroundColor = '#4a7ca8',
  textColor = '#ffffff',
}: TripActionButtonProps) {
  return (
    <Pressable
      style={({ hovered, pressed }) => [
        styles.button,
        { backgroundColor },
        hovered && styles.hovered,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {icon && <MaterialIcons name={icon} size={16} color={textColor} />}
      {label ? <Text style={[styles.label, { color: textColor }]}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 36, // wider button
    borderWidth: 1,
    borderColor: 'rgba(26, 61, 92, 0.18)',
  },
  hovered: {
    borderColor: 'rgba(74, 124, 168, 0.55)',
    shadowColor: '#2a4f73',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    transform: [{ translateY: -1 }],
  },
  pressed: {
    opacity: 0.85,
    transform: [{ translateY: 0 }],
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
  },
});
