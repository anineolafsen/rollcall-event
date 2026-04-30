import { View, Text, TouchableOpacity, StyleSheet, Modal, Linking } from "react-native";
import { AppButton } from "@/components/ui/button";
import type { Participant } from "@/types/participantType";
import { useState } from "react";

interface ParticipantProps {
  participant: Participant;
  mode: 'checked_in' | 'not_checked_in';
  isOrganizer: boolean;
  onToggle: (id: number, value: boolean) => void;
}

export function ParticipantItem({ participant, isOrganizer, onToggle }: Omit<ParticipantProps, 'mode'>) {
  const isCheckedIn = participant.checkedIn;
  const canToggle = isOrganizer;
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const handleCall = () => {
    if (participant.phone) {
      Linking.openURL(`tel:${participant.phone}`);
    }
  };

  const handleCheckboxPress = (e: any) => {
    e.stopPropagation();
    if (canToggle && !isCheckedIn) {
      setConfirmModalVisible(true);
    } else if (canToggle) {
      onToggle(participant.id, false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.row, isCheckedIn ? styles.rowGreen : styles.rowRed]}
        onPress={() => setPhoneModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.name}>{participant.name}</Text>
        <TouchableOpacity
          onPress={canToggle ? handleCheckboxPress : undefined}
          style={[styles.checkbox, isCheckedIn && styles.checkboxChecked, !canToggle && { opacity: 0.5 }]}
          disabled={!canToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isCheckedIn && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Phone number modal and contact button*/}
      <Modal
        visible={phoneModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setPhoneModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            <Text style={styles.cardName}>{participant.name}</Text>
            <View style={styles.divider} />
            <Text style={styles.phoneLabel}>Phone number:</Text>
            <Text style={styles.phoneNumber}>
              {participant.phone ?? 'Not available'}
            </Text>
            <AppButton
              label="Contact"
              onPress={handleCall}
              disabled={!participant.phone}
              style={{ width: '100%', marginTop: 8 }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Check-in confirmation modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={[styles.card, { padding: 24, alignItems: 'center', justifyContent: 'flex-end' }]}> 
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 32, textAlign: 'center' }}>
              Are you sure you want to check-in {participant.name}?
            </Text>
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 24, marginBottom: 8 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#4a90a4',
                  borderRadius: 30,
                  paddingVertical: 14,
                  width: 120,
                  alignItems: 'center',
                  marginRight: 16,
                }}
                onPress={() => {
                  setConfirmModalVisible(false);
                  onToggle(participant.id, true);
                }}
              >
                <Text style={[styles.contactBtnText, { fontSize: 17 }]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#aaa',
                  borderRadius: 30,
                  paddingVertical: 14,
                  width: 120,
                  alignItems: 'center',
                }}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={[styles.contactBtnText, { fontSize: 17 }]}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
  },
  rowGreen: { backgroundColor: '#d4edda' },
  rowRed:   { backgroundColor: '#f5c6cb' },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#4a90a4',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: { backgroundColor: '#4a90a4' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 32,
    width: 380,
    maxWidth: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0e5f7',
    shadowColor: '#4a7ca8',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a3d5c',
    marginBottom: 8,
  },
  divider: {
    width: '80%',
    height: 2,
    backgroundColor: '#4a7ca8',
    borderRadius: 2,
    marginBottom: 18,
  },
  phoneLabel: {
    fontSize: 15,
    color: '#4a7ca8',
    alignSelf: 'flex-start',
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  phoneNumber: {
    fontSize: 16,
    color: '#1a3d5c',
    alignSelf: 'flex-start',
    marginBottom: 28,
    fontWeight: '500',
  },
  contactBtn: {
    backgroundColor: '#4a7ca8',
    borderRadius: 999,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4a7ca8',
    shadowOpacity: 0.13,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  contactBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});