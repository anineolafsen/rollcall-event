import { Pressable, StyleSheet, Text, View } from 'react-native';

type SelectionChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function SelectionChip({ label, selected, onPress }: SelectionChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.selectionChip, selected ? styles.selectionChipActive : undefined]}>
      <View style={[styles.selectionDot, selected ? styles.selectionDotActive : undefined]} />
      <Text style={styles.selectionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  selectionChip: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9dfe4',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectionChipActive: {
    borderColor: '#111111',
    backgroundColor: '#ffffff',
  },
  selectionDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#b8c1c9',
    backgroundColor: '#ffffff',
  },
  selectionDotActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  selectionLabel: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
  },
});
