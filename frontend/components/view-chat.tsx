import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
  FlatList,
} from "react-native";
import { useUser, useAuth } from "@clerk/expo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:5118";

const ENABLE_MESSAGE_POLLING = false;
const POLLING_INTERVAL_MS = 3000;
const DRAWER_WIDTH = Dimensions.get("window").width * 0.3;

type Message = {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  timestamp: string;
};

type UserInfo = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

interface ChatData {
  id: number;
  title: string;
  tripId: number;
  creatorId: number;
}

interface Chat {
  id: number;
  tripId: number;
  title: string;
  creatorId: number;
  createdAt: string;
}

// Format ISO timestamp to HH:MM
interface Trip {
  id: number;
  name: string;
}

interface ChatWithTrip {
  chat: Chat;
  trip: Trip | null;
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// Generate two-letter initials from first and last name
function getInitialsFromName(firstName: string | null, lastName: string | null): string {
  const first = (firstName || "").trim().charAt(0).toUpperCase();
  const last = (lastName || "").trim().charAt(0).toUpperCase();
  return (first + last).slice(0, 2) || "?";
}

// Circular avatar showing initials
function Avatar({ firstName, lastName, isOwn }: { firstName: string | null; lastName: string | null; isOwn: boolean }) {
  return (
    <View style={[styles.avatar, isOwn && styles.avatarOwn]}>
      <Text style={styles.avatarText}>{getInitialsFromName(firstName, lastName)}</Text>
    </View>
  );
}

function MessageBubble({
  message,
  isOwn,
  onDelete,
  onEdit,
  userInfo,
}: {
  message: Message;
  isOwn: boolean;
  onDelete: (messageId: number) => void;
  onEdit: (messageId: number, newText: string) => void;
  userInfo: UserInfo | null;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const handleSaveEdit = async () => {
    if (editText.trim() && editText !== message.content) {
      await onEdit(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const displayName = userInfo ? `${userInfo.firstName || "User"}` : `User ${message.senderId}`;

  return (
    <View>
      {/* Message row: avatar + bubble + timestamp (+ menu for own messages) */}
      <View style={[styles.messageRow, isOwn && styles.messageRowUser]} pointerEvents="box-none">
        {/* Other user: avatar on the left */}
        {!isOwn && (
          <View style={styles.senderColumn}>
            <Avatar firstName={userInfo?.firstName || null} lastName={userInfo?.lastName || null} isOwn={false} />
            <Text style={styles.avatarName}>
              {displayName}
            </Text>
          </View>
        )}

        {/* Dropdown menu (own messages only) — positioned left of bubble */}
        {isOwn && (
          <View style={styles.menuContainer} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(!showMenu)}
            >
              <Text style={styles.menuIcon}>⋮</Text>
            </TouchableOpacity>

            {/* Dropdown menu items */}
            {showMenu && (
              <View style={styles.dropdownMenu} pointerEvents="auto">
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
                    onDelete(message.id);
                    setShowMenu(false);
                  }}
                >
                  <Text style={styles.menuItemDelete}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* */}
        <View
          style={[
            styles.bubble,
            isOwn ? styles.bubbleUser : styles.bubbleOther,
          ]}
        >
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
              {message.content}
            </Text>
          )}
        </View>

        <Text style={[styles.timestamp, isOwn && styles.timestampUser]}>
          {formatTime(message.timestamp)}
        </Text>

        {isOwn && (
          <View style={styles.senderColumn}>
            <Avatar firstName={userInfo?.firstName || null} lastName={userInfo?.lastName || null} isOwn={true} />
            <Text style={[styles.avatarName, styles.avatarNameOwn]}>You</Text>
          </View>
        )}
      </View>

      {isEditing && isOwn && (
        <View
          style={[styles.editActionsRow, isOwn && styles.editActionsRowUser]}
        >
          <TouchableOpacity
            style={[styles.editActionButton, styles.editCancelButton]}
            onPress={() => {
              setEditText(message.content);
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

function HeaderBar({
  chatTitle,
  onMenuPress,
  onEditPress,
  isCreator,
}: {
  chatTitle: string;
  onMenuPress: () => void;
  onEditPress: () => void;
  isCreator: boolean;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onMenuPress}
        style={styles.menuToggleButton}
        hitSlop={8}
      >
        <MaterialCommunityIcons name="menu" size={24} color={C.sky} />
      </TouchableOpacity>

      <View style={styles.headerInfo}>
        <Text style={styles.headerName} numberOfLines={1}>
          {chatTitle}
        </Text>
      </View>

      {isCreator && (
        <TouchableOpacity
          onPress={onEditPress}
          style={styles.editButton}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="pencil" size={20} color={C.sky} />
        </TouchableOpacity>
      )}
    </View>
  );
}

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
        style={[
          styles.sendButton,
          (!value.trim() || disabled) && styles.sendButtonDisabled,
        ]}
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

function ChatSidePanel({
  isOpen,
  onClose,
  currentChatID,
  onSelectChat,
  getToken,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentChatID: number | null;
  onSelectChat: (chatID: number) => void;
  getToken: any;
}) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  const [chatsWithTrips, setChatsWithTrips] = useState<ChatWithTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<Record<number, UserInfo>>({});

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0.9,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [isOpen, translateX, overlayOpacity]);

  const fetchCreatorUsers = useCallback(async (creatorIds: number[], token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const users: UserInfo[] = await response.json();
        const newCache: Record<number, UserInfo> = {};
        creatorIds.forEach(id => {
          const user = users.find(u => u.id === id);
          if (user) {
            newCache[id] = user;
          }
        });
        setUserCache(newCache);
      }
    } catch (err) {
      console.error('Failed to fetch creator users:', err);
    }
  }, []);

  const fetchAllChats = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken({ template: 'RollCallAuth' });
      const tripsRes = await fetch(`${API_BASE_URL}/api/trips/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const trips: Trip[] = tripsRes.ok ? await tripsRes.json() : [];

      // Fetch all chats in parallel instead of sequentially
      const allChats: ChatWithTrip[] = [];
      const chatPromises = trips.map(trip =>
        fetch(`${API_BASE_URL}/api/chats/trip/${trip.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(chatsRes => chatsRes.json())
          .then(chats => chats.map((chat: Chat) => ({ chat, trip })))
          .catch(() => [])
      );

      const chatResults = await Promise.all(chatPromises);
      chatResults.forEach(chats => allChats.push(...chats));

      allChats.sort(
        (a, b) =>
          new Date(b.chat.createdAt).getTime() -
          new Date(a.chat.createdAt).getTime(),
      );
      
      // Fetch creator user details
      const creatorIds = [...new Set(allChats.map(c => c.chat.creatorId))];
      await fetchCreatorUsers(creatorIds, token);
      
      setChatsWithTrips(allChats);
    } catch {
      setError("Could not load chats.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isOpen && chatsWithTrips.length === 0) {
      fetchAllChats();
    }
  }, [isOpen, chatsWithTrips.length, fetchAllChats]);

  if (!mounted && !isOpen) return null;

  const renderItem = ({ item }: { item: ChatWithTrip }) => {
    const isActive = item.chat.id === currentChatID;
    return (
      <TouchableOpacity
        onPress={() => {
          if (!isActive) onSelectChat(item.chat.id);
          onClose();
        }}
        activeOpacity={0.75}
      >
        <View style={[styles.panelCard, isActive && styles.panelCardActive]}>
          <View style={styles.panelCardHeader}>
            <View style={styles.panelChatInfo}>
              <Text
                style={[
                  styles.panelChatTitle,
                  isActive && styles.panelChatTitleActive,
                ]}
                numberOfLines={1}
              >
                {item.chat.title}
              </Text>
              {item.trip && (
                <Text style={styles.panelTripName} numberOfLines={1}>
                  📌 {item.trip.name}
                </Text>
              )}
            </View>
            <Text style={styles.panelTimestamp}>
              {formatDate(item.chat.createdAt)}
            </Text>
          </View>
          <Text style={styles.panelCreatedBy}>
            {userCache[item.chat.creatorId] ? (
              `By ${userCache[item.chat.creatorId].firstName || ''} ${userCache[item.chat.creatorId].lastName || ''}`.trim()
            ) : (
              `By User #${item.chat.creatorId}`
            )}
          </Text>
          {isActive && <View style={styles.activeIndicator} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={isOpen ? "auto" : "none"}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <SafeAreaView style={styles.drawerSafeArea}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Chats</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.drawerCloseButton}
              hitSlop={8}
            >
              <Text style={styles.drawerCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.drawerDivider} />

          {loading ? (
            <View style={styles.drawerCentered}>
              <ActivityIndicator size="large" color="#00C49A" />
              <Text style={styles.drawerLoadingText}>Loading chats…</Text>
            </View>
          ) : error ? (
            <View style={styles.drawerCentered}>
              <Text style={styles.drawerErrorText}>{error}</Text>
              <TouchableOpacity
                style={styles.drawerRetryButton}
                onPress={fetchAllChats}
              >
                <Text style={styles.drawerRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : chatsWithTrips.length === 0 ? (
            <View style={styles.drawerCentered}>
              <Text style={styles.drawerEmptyText}>No chats yet.</Text>
            </View>
          ) : (
            <FlatList
              data={chatsWithTrips}
              keyExtractor={(item) => item.chat.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.drawerList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [userCache, setUserCache] = useState<Record<number, UserInfo>>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const chatID = id ? Number(id) : null;
  const userCacheRef = useRef<Record<number, UserInfo>>({});
  const fetchingRef = useRef<Set<number>>(new Set());

  // Update ref when cache changes
  useEffect(() => {
    userCacheRef.current = userCache;
  }, [userCache]);

  // Fetch current user's internal ID from API
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = await getToken({ template: 'RollCallAuth' });
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.id);
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };
    fetchCurrentUser();
  }, [getToken]);

  // Fetch user details by ID
  const fetchUserById = useCallback(async (userId: number) => {
    if (userCacheRef.current[userId]) {
      return userCacheRef.current[userId];
    }

    // Prevent duplicate fetch requests
    if (fetchingRef.current.has(userId)) {
      return null;
    }

    fetchingRef.current.add(userId);

    try {
      const token = await getToken({ template: 'RollCallAuth' });
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const users: UserInfo[] = await response.json();
        const user = users.find(u => u.id === userId);
        if (user) {
          setUserCache(prev => ({ ...prev, [userId]: user }));
          return user;
        }
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    } finally {
      fetchingRef.current.delete(userId);
    }
    
    return null;
  }, [getToken]);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setError(null);
        if (!chatID) throw new Error("Chat ID is required");

        const token = await getToken({ template: 'RollCallAuth' });
        const chatResponse = await fetch(`${API_BASE_URL}/api/chats/${chatID}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!chatResponse.ok) throw new Error("Failed to load chat");
        const chat = await chatResponse.json();
        setChatData(chat);

        const messagesResponse = await fetch(
          `${API_BASE_URL}/api/chat-messages/chat/${chatID}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const messagesData = messagesResponse.ok
          ? await messagesResponse.json()
          : [];

        const transformedMessages: Message[] = messagesData.map((msg: any) => ({
          id: msg.id,
          chatId: msg.chatId,
          content: msg.content,
          senderId: msg.senderId,
          timestamp: msg.timestamp,
        }));

        setMessages(transformedMessages);
      } catch (err) {
        console.error("Failed to fetch chat:", err);
        setError("Failed to load chat");
      }
    };

    if (chatID) {
      fetchChatData();
      if (ENABLE_MESSAGE_POLLING) {
        const interval = setInterval(fetchChatData, POLLING_INTERVAL_MS);
        return () => clearInterval(interval);
      }
    }
  }, [chatID]);

  // Check if current user is the creator
  useEffect(() => {
    if (chatData && currentUserId) {
      const isCreatorMatch = chatData.creatorId === currentUserId;
      setIsCreator(isCreatorMatch);
    }
  }, [chatData, currentUserId]);

  // Fetch user data for all message senders
  useEffect(() => {
    const uniqueIds = new Set(messages.map(m => m.senderId));
    uniqueIds.forEach(id => {
      if (!userCacheRef.current[id]) {
        fetchUserById(id);
      }
    });
  }, [messages, fetchUserById]);

  const handleSend = async () => {
    const text = draft.trim().replace(/[\n\r]+$/, "");
    if (!text || !currentUserId || !chatID) return;

    try {
      setSending(true);
      const token = await getToken({ template: 'RollCallAuth' });
      const response = await fetch(`${API_BASE_URL}/api/chat-messages`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ChatId: chatID,
          SenderId: currentUserId,
          Content: text,
          Timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      const sentMessage = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: sentMessage.id,
          chatId: sentMessage.chatId,
          content: sentMessage.content,
          senderId: sentMessage.senderId,
          timestamp: sentMessage.timestamp,
        },
      ]);
      setDraft("");
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (err) {
      console.error("Failed to send message:", err);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const token = await getToken({ template: 'RollCallAuth' });
      const url = `${API_BASE_URL}/api/chat-messages/${messageId}`;
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete message");
      }
      
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      Alert.alert("Success", "Message deleted");
    } catch (err) {
      console.error("Failed to delete message:", err);
      Alert.alert("Error", "Failed to delete message");
    }
  };

  const handleEditMessage = async (messageId: number, newContent: string) => {
    try {
      const token = await getToken({ template: 'RollCallAuth' });
      const url = `${API_BASE_URL}/api/chat-messages/${messageId}`;
      
      const body = {
        Content: newContent,
      };
      
      const response = await fetch(url, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update message: ${errorText}`);
      }
      
      const updatedMessage = await response.json();
      
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                content: updatedMessage.content,
                timestamp: updatedMessage.timestamp,
              }
            : m,
        ),
      );
      Alert.alert("Success", "Message updated");
    } catch (err) {
      console.error("Failed to update message:", err);
      Alert.alert("Error", "Failed to update message");
    }
  };

  const handleSelectChat = (newChatID: number) => {
    setChatData(null);
    setMessages([]);
    router.replace(`/(app)/(tabs)/chats/${newChatID}` as any);
  };

  if (error && !chatData) {
    return (
      <SafeAreaView style={styles.screen}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorMessage}>{error || "Chat not found"}</Text>
        </View>
      </SafeAreaView>
    );
  }

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

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <HeaderBar
            chatTitle={chatData.title}
            onMenuPress={() => setPanelOpen(true)}
            onEditPress={() => router.push(`/(app)/(tabs)/chats/${chatID}/edit` as any)}
            isCreator={isCreator}
          />

          <ScrollView
            ref={scrollRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: false })
            }
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No messages yet</Text>
              </View>
            ) : (
              messages.map((msg) => {
                const senderInfo = userCache[msg.senderId] || null;
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={
                      msg.senderId === currentUserId
                    }
                    onDelete={handleDeleteMessage}
                    onEdit={handleEditMessage}
                    userInfo={senderInfo}
                  />
                );
              })
            )}
          </ScrollView>

          <ComposerBar
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            disabled={sending}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>

      <View
        style={[
          styles.panelContainer,
          panelOpen && styles.panelContainerActive,
        ]}
      >
        <ChatSidePanel
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
          currentChatID={chatID}
          onSelectChat={handleSelectChat}
          getToken={getToken}
        />
      </View>
    </View>
  );
}

const C = {
  charcoal: "#343434",
  sky: "#7CC6FE",
  background: "#F4FAFF",
  teal: "#00C49A",
  surface: "#FFFFFF",
  border: "#D6EAF8",
  muted: "#7A9BB5",
  disabled: "#C2D8E8",
  panelBg: "#eef5fb",
  panelActiveBorder: "#00C49A",
  panelActiveText: "#00C49A",
  panelActiveBg: "#f0fdf9",
} as const;

const BUBBLE_RADIUS = 18;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: { flex: 1 },

  screen: {
    flex: 1,
    backgroundColor: C.background,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.muted,
    fontWeight: "500",
  },
  errorMessage: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    gap: 10,
  },
  backButton: {
    width: 32,
    alignItems: "center",
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
    fontWeight: "600",
    color: C.charcoal,
  },
  menuToggleButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: C.background,
    alignItems: "center",
    flexShrink: 0,
  },
  editButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.teal,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarOwn: {
    alignSelf: "flex-end",
  },
  avatarText: {
    color: C.surface,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  senderColumn: {
    alignItems: "center",
    flexShrink: 0,
  },
  avatarName: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
    maxWidth: 40,
    textAlign: "center",
  },
  avatarNameOwn: {
    fontWeight: "600",
    color: C.sky,
  },

  messageList: { flex: 1 },
  messageListContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 4,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 6,
    gap: 6,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },

  bubble: {
    maxWidth: "60%",
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
    alignSelf: "flex-end",
  },

  menuContainer: {
    position: "relative",
    justifyContent: "flex-end",
  },
  menuButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: {
    fontSize: 20,
    color: C.muted,
    fontWeight: "600",
  },
  dropdownMenu: {
    position: "absolute",
    top: 30,
    right: 0,
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 120,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 1000,
  },
  menuItem: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: 13,
    color: C.charcoal,
    fontWeight: "500",
  },
  menuItemDelete: {
    fontSize: 13,
    color: "#d32f2f",
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    backgroundColor: C.border,
  },

  // Inline edit
  editInput: {
    fontSize: 15,
    color: C.charcoal,
    lineHeight: 21,
    padding: 8,
    backgroundColor: C.background,
    borderRadius: 6,
  },
  editInputUser: {
    backgroundColor: "rgba(124, 198, 254, 0.1)",
    color: C.surface,
  },
  editActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 50,
    marginTop: 4,
    marginBottom: 8,
  },
  editActionsRowUser: {
    justifyContent: "flex-end",
    marginRight: 50,
  },
  editActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editCancelButton: { backgroundColor: C.disabled },
  editSaveButton: { backgroundColor: C.teal },
  editActionText: {
    fontSize: 12,
    color: C.surface,
    fontWeight: "600",
  },

  // Composer
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === "ios" ? 8 : 12,
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
    paddingTop: Platform.OS === "ios" ? 9 : 7,
    paddingBottom: Platform.OS === "ios" ? 9 : 7,
    fontSize: 15,
    color: C.charcoal,
    lineHeight: 20,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.teal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendButtonDisabled: { backgroundColor: C.disabled },
  sendIcon: {
    color: C.surface,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: -1,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: C.muted,
  },

  // Panel container to constrain animation
  panelContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
  panelContainerActive: {
    pointerEvents: "auto",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30, 50, 70, 0.38)",
    zIndex: 100,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: C.panelBg,
    zIndex: 101,
    shadowColor: "#1a3a5c",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 6, height: 0 },
    elevation: 12,
  },
  drawerSafeArea: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  drawerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#090909",
  },
  drawerCloseButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerCloseIcon: {
    fontSize: 16,
    color: C.muted,
    fontWeight: "600",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "#d9e8f5",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  drawerList: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  drawerCentered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  drawerLoadingText: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "500",
  },
  drawerErrorText: {
    fontSize: 14,
    color: "#d32f2f",
    textAlign: "center",
  },
  drawerRetryButton: {
    backgroundColor: "#4a7ca8",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  drawerRetryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  drawerEmptyText: {
    fontSize: 15,
    color: C.muted,
    fontWeight: "500",
  },

  // Panel chat card
  panelCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d9e8f5",
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: "hidden",
  },
  panelCardActive: {
    backgroundColor: C.panelActiveBg,
    borderColor: C.panelActiveBorder,
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: C.teal,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  panelCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  panelChatInfo: {
    flex: 1,
    marginRight: 8,
  },
  panelChatTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#090909",
    marginBottom: 3,
  },
  panelChatTitleActive: {
    color: C.panelActiveText,
  },
  panelTripName: {
    fontSize: 12,
    color: "#4a7ca8",
    fontWeight: "500",
  },
  panelTimestamp: {
    fontSize: 11,
    color: C.muted,
    flexShrink: 0,
  },
  panelCreatedBy: {
    fontSize: 11,
    color: C.muted,
  },
});
