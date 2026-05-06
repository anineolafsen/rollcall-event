import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CheckinSessionModalProps = {
  visible: boolean;
  eventName: string;
  checkingIn: boolean;
  onCheckIn: () => void;
  onContact: () => void;
  onClose: () => void;
};

export function CheckinSessionModal({
  visible,
  eventName,
  checkingIn,
  onCheckIn,
  onContact,
  onClose,
}: CheckinSessionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Check in for:</Text>
          <View style={styles.eventNameContainer}>
            <Text style={styles.eventName}>{eventName || 'Event'}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, checkingIn && styles.disabledButton]}
            onPress={onCheckIn}
            disabled={checkingIn}
          >
            <Text style={styles.primaryButtonText}>{checkingIn ? 'Checking in...' : 'Check in'}</Text>
          </TouchableOpacity>

          <Text style={styles.contactLabel}>If you are not here:</Text>
          <TouchableOpacity style={styles.contactButton} onPress={onContact}>
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#eaf5ff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#101010',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 12,
    padding: 6,
  },
  closeText: {
    fontSize: 28,
    color: '#888',
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6c757d',
    marginBottom: 12,
  },
  eventNameContainer: {
    backgroundColor: '#b7ddff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 30,
    minWidth: '70%',
    alignItems: 'center',
  },
  eventName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#090909',
  },
  primaryButton: {
    backgroundColor: '#eaf7ec',
    borderWidth: 1,
    borderColor: '#4c915f',
    borderRadius: 36,
    paddingVertical: 24,
    paddingHorizontal: 64,
    marginBottom: 32,
    minWidth: 260,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4c915f',
  },
  contactLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#090909',
    marginBottom: 10,
  },
  contactButton: {
    backgroundColor: '#fff0f1',
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 44,
    borderColor: '#d45162',
    borderWidth: 1,
  },
  contactButtonText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#d45162',
  },
});
