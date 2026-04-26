import { TouchableOpacity, View, Text, StyleSheet } from "react-native";

type Tab = 'checked_in' | 'not_checked_in';

interface TabProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  checkedInCount?: number;
  notCheckedInCount?: number;
}

export default function TabSwitcher({ activeTab, onTabChange }: TabProps) {
  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabChange('checked_in')}
        >
          <Text
            style={[
              styles.label,
              activeTab === 'checked_in'
                ? styles.checkedActive
                : styles.inactive,
            ]}
          >
            Checked-in
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabChange('not_checked_in')}
        >
          <Text
            style={[
              styles.label,
              activeTab === 'not_checked_in'
                ? styles.notCheckedActive
                : styles.inactiveRed,
            ]}
          >
            Not Checked-in
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.lineWrapper}>
        <View style={styles.fullLine} />
        <View
          style={[
            styles.divider,
            activeTab === 'checked_in'
              ? styles.dividerGray
              : styles.dividerRed,
          ]}
        />
        <View
          style={[
            styles.activeUnderline,
            activeTab === 'checked_in'
              ? styles.leftUnderline
              : styles.rightUnderline,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },

  tabRow: {
    flexDirection: 'row',
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },

  label: {
    fontSize: 16,
  },

  checkedActive: {
    color: '#3c7f3c',
    fontWeight: '600',
  },

  notCheckedActive: {
    color: '#ef4444',
    fontWeight: '600',
  },

  inactive: {
    color: '#cbd5e1',
  },

  inactiveRed: {
    color: '#fecaca',
  },

  lineWrapper: {
    marginTop: 8,
    justifyContent: 'center',
  },

  fullLine: {
    height: 2,
    backgroundColor: '#e2e8f0',
    width: '100%',
  },

  divider: {
    position: 'absolute',
    alignSelf: 'center',
    width: 2,
    height: 10,
  },

  dividerGray: {
    backgroundColor: '#64748b',
  },

  dividerRed: {
    backgroundColor: '#ef4444',
  },

  activeUnderline: {
    position: 'absolute',
    height: 2,
    width: '50%',
  },

  leftUnderline: {
    left: 0,
    backgroundColor: '#64748b',
  },

  rightUnderline: {
    right: 0,
    backgroundColor: '#ef4444',
  },
});