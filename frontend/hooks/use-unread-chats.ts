import { useAuth } from '@clerk/expo';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const CHAT_UPDATED_EVENT = 'rollcall:chat-unread-updated';
const CHAT_POLL_MS = 15000;
const LAST_READ_KEY_PREFIX = 'rollcall:chat-last-read:';

type Chat = {
  id: number;
};

type Trip = {
  id: number;
};

type Message = {
  senderId: number;
  timestamp: string;
};

function getLastReadKey(chatId: number) {
  return `${LAST_READ_KEY_PREFIX}${chatId}`;
}

async function readStoredValue(key: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function writeStoredValue(key: string, value: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

function notifyChatUnreadChanged() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHAT_UPDATED_EVENT));
  }
}

export async function markChatAsRead(chatId: number, timestamp: string) {
  await writeStoredValue(getLastReadKey(chatId), timestamp);
  notifyChatUnreadChanged();
}

export function useUnreadChats() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  const [unreadChatIds, setUnreadChatIds] = useState<number[]>([]);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const refreshUnreadChats = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setUnreadChatIds([]);
      return;
    }

    try {
      const token = await getTokenRef.current({ template: 'RollCallAuth' });
      if (!token) {
        setUnreadChatIds([]);
        return;
      }

      const meResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!meResponse.ok) {
        throw new Error(`Failed to fetch current user: ${meResponse.status}`);
      }

      const me = await meResponse.json();
      const currentUserId = me.id as number;

      const tripsResponse = await fetch(`${API_BASE_URL}/api/trips/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const trips: Trip[] = tripsResponse.ok ? await tripsResponse.json() : [];

      const chatResults = await Promise.all(
        trips.map(async (trip) => {
          const response = await fetch(`${API_BASE_URL}/api/chats/trip/${trip.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return response.ok ? ((await response.json()) as Chat[]) : [];
        })
      );

      const chats = chatResults.flat();
      if (chats.length === 0) {
        setUnreadChatIds([]);
        return;
      }

      const unreadResults = await Promise.all(
        chats.map(async (chat) => {
          const response = await fetch(`${API_BASE_URL}/api/chat-messages/chat/${chat.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const messages: Message[] = response.ok ? await response.json() : [];
          if (messages.length === 0) {
            return false;
          }

          const latestMessage = messages.reduce((latest, current) => (
            new Date(current.timestamp).getTime() > new Date(latest.timestamp).getTime()
              ? current
              : latest
          ));

          if (latestMessage.senderId === currentUserId) {
            return false;
          }

          const lastRead = await readStoredValue(getLastReadKey(chat.id));
          if (!lastRead) {
            return true;
          }

          return new Date(latestMessage.timestamp).getTime() > new Date(lastRead).getTime();
        })
      );

      setUnreadChatIds(
        chats
          .filter((_, index) => unreadResults[index])
          .map((chat) => chat.id)
      );
    } catch {
      setUnreadChatIds([]);
    }
  }, [isLoaded, isSignedIn]);

  useFocusEffect(
    useCallback(() => {
      void refreshUnreadChats();
    }, [refreshUnreadChats])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshUnreadChats();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshUnreadChats]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const handleChatUpdated = () => {
      void refreshUnreadChats();
    };

    window.addEventListener(CHAT_UPDATED_EVENT, handleChatUpdated);
    return () => {
      window.removeEventListener(CHAT_UPDATED_EVENT, handleChatUpdated);
    };
  }, [refreshUnreadChats]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void refreshUnreadChats();
    }, CHAT_POLL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshUnreadChats]);

  return {
    hasUnreadChats: unreadChatIds.length > 0,
    unreadChatIds,
    refreshUnreadChats,
  };
}
