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
      style={({ pressed }) => [styles.button, { backgroundColor }, pressed && styles.pressed]}
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
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
  },
});
