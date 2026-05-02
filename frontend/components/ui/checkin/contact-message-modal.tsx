import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const MAX_LENGTH = 150;

type ContactMessageModalProps = {
  visible: boolean;
  onSend: (body: string) => Promise<void>;
  onClose: () => void;
};

export function ContactMessageModal({ visible, onSend, onClose }: ContactMessageModalProps) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setBody('');
    } catch {
      setSending(false);
      Alert.alert('Error', 'Could not send message. Please try again.');
    }
  };

  const handleClose = () => {
    setBody('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Send message to organizer</Text>
          <Text style={styles.subtitle}>Let them know why you can't check in right now.</Text>

          <TextInput
            style={styles.textarea}
            value={body}
            onChangeText={t => setBody(t.slice(0, MAX_LENGTH))}
            placeholder="Write your message..."
            placeholderTextColor="#aaa"
            multiline
            maxLength={MAX_LENGTH}
            editable={!sending}
          />
          <Text style={styles.counter}>{body.length}/{MAX_LENGTH}</Text>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={sending}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, (!body.trim() || sending) && styles.disabledButton]}
              onPress={handleSend}
              disabled={!body.trim() || sending}
            >
              <Text style={styles.sendText}>{sending ? 'Sending...' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#eaf5ff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#101010',
    paddingVertical: 28,
    paddingHorizontal: 20,
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
    color: '#090909',
    marginBottom: 6,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  textarea: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#b7ddff',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#111',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#888',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  sendButton: {
    backgroundColor: '#4a90a4',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
