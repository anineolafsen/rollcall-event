import { Modal, TouchableOpacity, View, Text, StyleSheet } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectSelfCheckIn: () => void;
  onSelectQrCheckIn: () => void;
};

export function CheckInMethodModal({ visible, onClose, onSelectSelfCheckIn, onSelectQrCheckIn }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Choose check-in method</Text>
          <Text style={styles.subtitle}>How should participants check in?</Text>

          <TouchableOpacity style={styles.methodButton} onPress={onSelectQrCheckIn}>
            
            <View>
              <Text style={styles.methodLabel}>QR Code</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.methodButton} onPress={onSelectSelfCheckIn}>
           
            <View>
              <Text style={styles.methodLabel}>Self Check-in</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#090909', marginBottom: 2 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f0f6fc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cce0f5',
  },
  icon: { fontSize: 28 },
  methodLabel: { fontSize: 16, fontWeight: '700', color: '#090909' },
  methodDescription: { fontSize: 13, color: '#666', marginTop: 2 },
  cancelButton: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  cancelText: { fontSize: 15, color: '#888', fontWeight: '600' },
});