import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useUser } from '@clerk/expo';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5118';

const ENABLE_MESSAGE_POLLING = false;
const POLLING_INTERVAL_MS = 3000;

type Message = {
  messageID: number;
  text: string;
  senderEmail: string;
  timestamp: string;
};

interface ChatData {
  chatID: number;
  title: string;
  tripID: number;
  creatorID: string;
}

// Format ISO timestamp to HH:MM
function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// Derive two-letter initials from an email address
function getInitials(email: string): string {
  return email
    .split('@')[0]
    .split(/[._]/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Circular avatar showing initials
function Avatar({ email, isOwn }: { email: string; isOwn: boolean }) {
  return (
    <View style={[styles.avatar, isOwn && styles.avatarOwn]}>
      <Text style={styles.avatarText}>{getInitials(email)}</Text>
    </View>
  );
}

// Individual message bubble with edit/delete support
function MessageBubble({
  message,
  isOwn,
  onDelete,
  onEdit,
}: {
  message: Message;
  isOwn: boolean;
  onDelete: (messageId: number) => void;
  onEdit: (messageId: number, newText: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const handleSaveEdit = async () => {
    if (editText.trim() && editText !== message.text) {
      await onEdit(message.messageID, editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <View>
      {/* Message row: avatar + bubble + timestamp (+ menu for own messages) */}
      <View style={[styles.messageRow, isOwn && styles.messageRowUser]}>

        {/* Other user: avatar on the left */}
        {!isOwn && (
          <View style={styles.senderColumn}>
            <Avatar email={message.senderEmail} isOwn={false} />
            <Text style={styles.avatarName}>{message.senderEmail.split('@')[0]}</Text>
          </View>
        )}

        {/* Dropdown menu (own messages only) — positioned left of bubble */}
        {isOwn && (
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(!showMenu)}
            >
              <Text style={styles.menuIcon}>⋮</Text>
            </TouchableOpacity>

            {/* Dropdown — opens downward, anchored to the right edge of the button */}
            {showMenu && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                >
                  <Text style={styles.menuItemText}>✏️ Edit</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onDelete(message.messageID);
                    setShowMenu(false);
                  }}
                >
                  <Text style={styles.menuItemDelete}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Chat bubble */}
        <View style={[styles.bubble, isOwn ? styles.bubbleUser : styles.bubbleOther]}>
          {isEditing ? (
            <TextInput
              style={[styles.editInput, isOwn && styles.editInputUser]}
              value={editText}
              onChangeText={setEditText}
              multiline
              maxLength={1000}
              autoFocus
            />
          ) : (
            <Text style={[styles.bubbleText, isOwn && styles.bubbleTextUser]}>
              {message.text}
            </Text>
          )}
        </View>

        {/* Timestamp */}
        <Text style={[styles.timestamp, isOwn && styles.timestampUser]}>
          {formatTime(message.timestamp)}
        </Text>

        {/* Own user: avatar on the right */}
        {isOwn && (
          <View style={styles.senderColumn}>
            <Avatar email={message.senderEmail} isOwn={true} />
            <Text style={[styles.avatarName, styles.avatarNameOwn]}>You</Text>
          </View>
        )}
      </View>

      {/* Edit action buttons shown below the row when editing */}
      {isEditing && isOwn && (
        <View style={[styles.editActionsRow, isOwn && styles.editActionsRowUser]}>
          <TouchableOpacity
            style={[styles.editActionButton, styles.editCancelButton]}
            onPress={() => {
              setEditText(message.text);
              setIsEditing(false);
            }}
          >
            <Text style={styles.editActionText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editActionButton, styles.editSaveButton]}
            onPress={handleSaveEdit}
          >
            <Text style={styles.editActionText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Top navigation bar with back button and chat title
function HeaderBar({
  chatTitle,
  onBack,
}: {
  chatTitle: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={8}>
        <Text style={styles.backArrow}>‹</Text>
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <Text style={styles.headerName}>{chatTitle}</Text>
      </View>
    </View>
  );
}

// Bottom text input and send button
function ComposerBar({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.composer}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="Message…"
        placeholderTextColor="#7A9BB5"
        multiline
        maxLength={1000}
        returnKeyType="send"
        onSubmitEditing={(e) => {
          e.preventDefault();
          onSend();
        }}
        editable={!disabled}
      />
      <TouchableOpacity
        style={[styles.sendButton, (!value.trim() || disabled) && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!value.trim() || disabled}
        hitSlop={4}
      >
        {disabled ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.sendIcon}>↑</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatID = id ? Number(id) : null;

  // Fetch chat metadata and message list; optionally poll for new messages
  useEffect(() => {
    const fetchChatData = async (isInitialLoad = false) => {
      try {
        setError(null);

        if (!chatID) {
          throw new Error('Chat ID is required');
        }

        const chatResponse = await fetch(`${API_BASE_URL}/api/chats/${chatID}`);
        if (!chatResponse.ok) {
          throw new Error('Failed to load chat');
        }
        const chat = await chatResponse.json();
        setChatData(chat);

        const messagesResponse = await fetch(`${API_BASE_URL}/api/chat-messages/chat/${chatID}`);
        const messagesData = messagesResponse.ok
          ? await messagesResponse.json()
          : [];

        const transformedMessages: Message[] = messagesData.map((msg: any) => ({
          messageID: msg.messageID,
          text: msg.content,
          senderEmail: msg.senderEmail,
          timestamp: msg.timestamp,
        }));

        setMessages(transformedMessages);
      } catch (err) {
        console.error('Failed to fetch chat:', err);
        setError('Failed to load chat');
      }
    };

    if (chatID) {
      fetchChatData(true);

      if (ENABLE_MESSAGE_POLLING) {
        const interval = setInterval(() => {
          fetchChatData(false);
        }, POLLING_INTERVAL_MS);
        return () => clearInterval(interval);
      }
    }
  }, [chatID]);

  // Send a new message and append it optimistically
  const handleSend = async () => {
    const text = draft.trim().replace(/[\n\r]+$/, '');
    if (!text || !user?.primaryEmailAddress?.emailAddress || !chatID) {
      return;
    }

    try {
      setSending(true);

      const response = await fetch(`${API_BASE_URL}/api/chat-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatID,
          senderEmail: user.primaryEmailAddress.emailAddress,
          content: text,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const sentMessage = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          messageID: sentMessage.messageID,
          text: sentMessage.content,
          senderEmail: sentMessage.senderEmail,
          timestamp: sentMessage.timestamp,
        },
      ]);

      setDraft('');

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    } catch (err) {
      console.error('Failed to send message:', err);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Remove a message from the server and local state
  const handleDeleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      setMessages((prev) => prev.filter((m) => m.messageID !== messageId));
      Alert.alert('Success', 'Message deleted');
    } catch (err) {
      console.error('Failed to delete message:', err);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  // Persist an edited message and update local state
  const handleEditMessage = async (messageId: number, newContent: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatID: chatID,
          senderEmail: user?.primaryEmailAddress?.emailAddress,
          content: newContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update message');
      }

      const updatedMessage = await response.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.messageID === messageId
            ? {
              ...m,
              text: updatedMessage.content,
              timestamp: updatedMessage.timestamp,
            }
            : m
        )
      );
      Alert.alert('Success', 'Message updated');
    } catch (err) {
      console.error('Failed to update message:', err);
      Alert.alert('Error', 'Failed to update message');
    }
  };

  // Error state: chat failed to load
  if (error && !chatData) {
    return (
      <SafeAreaView style={styles.screen}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorMessage}>{error || 'Chat not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state: waiting for initial chat metadata
  if (!chatData) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C49A" />
          <Text style={styles.loadingText}>Loading conversation…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main chat UI
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {/* Header */}
        <HeaderBar chatTitle={chatData.title} onBack={() => router.back()} />

        {/* Message list */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No messages yet</Text>
            </View>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.messageID}
                message={msg}
                isOwn={msg.senderEmail === user?.primaryEmailAddress?.emailAddress}
                onDelete={handleDeleteMessage}
                onEdit={handleEditMessage}
              />
            ))
          )}
        </ScrollView>

        {/* Composer */}
        <ComposerBar
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          disabled={sending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const C = {
  charcoal: '#343434',
  sky: '#7CC6FE',
  background: '#F4FAFF',
  teal: '#00C49A',
  surface: '#FFFFFF',
  border: '#D6EAF8',
  muted: '#7A9BB5',
  disabled: '#C2D8E8',
} as const;

const BUBBLE_RADIUS = 18;

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Screen
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },

  // Loading / error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.muted,
    fontWeight: '500',
  },
  errorMessage: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },

  // Header bar
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    gap: 10,
  },
  backButton: {
    width: 32,
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 32,
    color: C.sky,
    lineHeight: 36,
    marginTop: -2,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: C.charcoal,
  },

  // Avatar
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarOwn: {
    alignSelf: 'flex-end',
  },
  avatarText: {
    color: C.surface,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  senderColumn: {
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarName: {
    fontSize: 10,
    color: C.muted,
    marginTop: 2,
    maxWidth: 40,
    textAlign: 'center',
  },
  avatarNameOwn: {
    fontWeight: '600',
    color: C.sky,
  },

  // Message list
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 4,
  },

  // Message row
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
    gap: 6,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },

  // Chat bubble
  bubble: {
    maxWidth: '60%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BUBBLE_RADIUS,
  },
  bubbleOther: {
    backgroundColor: C.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: C.sky,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: C.charcoal,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: C.surface,
  },

  // Timestamp
  timestamp: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
    marginLeft: 6,
    minWidth: 35,
  },
  timestampUser: {
    marginLeft: 6,
    marginRight: 0,
    alignSelf: 'flex-end',
  },

  // Three-dot menu button and dropdown
  menuContainer: {
    position: 'relative',
    justifyContent: 'flex-end',
  },
  menuButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 20,
    color: C.muted,
    fontWeight: '600',
  },
  // Dropdown drops downward, right-aligned under the ⋮ button
  dropdownMenu: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 120,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 1000,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 13,
    color: C.charcoal,
    fontWeight: '500',
  },
  menuItemDelete: {
    fontSize: 13,
    color: '#d32f2f',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: C.border,
  },

  // Inline edit input inside bubble
  editInput: {
    fontSize: 15,
    color: C.charcoal,
    lineHeight: 21,
    padding: 8,
    backgroundColor: C.background,
    borderRadius: 6,
  },
  editInputUser: {
    backgroundColor: 'rgba(124, 198, 254, 0.1)',
    color: C.surface,
  },

  // Edit confirm/cancel buttons below the bubble
  editActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 50,
    marginTop: 4,
    marginBottom: 8,
  },
  editActionsRowUser: {
    justifyContent: 'flex-end',
    marginRight: 50,
  },
  editActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editCancelButton: {
    backgroundColor: C.disabled,
  },
  editSaveButton: {
    backgroundColor: C.teal,
  },
  editActionText: {
    fontSize: 12,
    color: C.surface,
    fontWeight: '600',
  },

  // Composer bar
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    backgroundColor: C.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    backgroundColor: C.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 9 : 7,
    paddingBottom: Platform.OS === 'ios' ? 9 : 7,
    fontSize: 15,
    color: C.charcoal,
    lineHeight: 20,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: C.disabled,
  },
  sendIcon: {
    color: C.surface,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: -1,
  },

  // Empty state placeholder
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: C.muted,
  },
});