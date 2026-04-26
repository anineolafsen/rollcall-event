import { View, Text, StyleSheet } from "react-native";

interface CheckinProps {
  checked: number;
  total: number;
}

export default function CheckinCounter({ checked, total }: CheckinProps){
  const allCheckedIn = checked === total;
  const none = checked === 0;

  const backgroundColor = none ? '#e05555' : allCheckedIn ? '#5cb85c' : '#969696';

  return (
    <View style={[styles.counter, { backgroundColor }]}>
      <Text style={styles.text}>{checked}/{total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center'
  },
  text: {
    color: '#fff',
    fontSize: 22,
    fontWeight:'700',
  },
})