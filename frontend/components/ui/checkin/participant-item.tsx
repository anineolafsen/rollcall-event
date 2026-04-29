import { View, Text, TouchableOpacity, StyleSheet, Modal, Linking } from "react-native";
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
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{participant.name}</Text>
          {!isCheckedIn && participant.message ? (
            <Text style={styles.messagePreview} numberOfLines={1}>
              {participant.message.length > 60
                ? participant.message.slice(0, 60) + '…'
                : participant.message}
            </Text>
          ) : null}
        </View>
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
            <TouchableOpacity
              style={[styles.contactBtn, !participant.phone && { opacity: 0.4 }]}
              onPress={handleCall}
              disabled={!participant.phone}
            >
              <Text style={styles.contactBtnText}>CONTACT</Text>
            </TouchableOpacity>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
  },
  rowGreen: { backgroundColor: '#d4edda' },
  rowRed:   { backgroundColor: '#f5c6cb' },
  nameBlock: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
  },
  messagePreview: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
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
    backgroundColor: '#d6eaf8',
    borderRadius: 16,
    padding: 24,
    width: '75%',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  divider: {
    width: '80%',
    height: 1.5,
    backgroundColor: '#111',
    marginBottom: 16,
  },
  phoneLabel: {
    fontSize: 15,
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 15,
    color: '#111',
    alignSelf: 'flex-start',
    marginBottom: 28,
  },
  contactBtn: {
    backgroundColor: '#111',
    borderRadius: 30,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  contactBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
});