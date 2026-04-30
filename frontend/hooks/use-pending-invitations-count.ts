import { useAuth } from '@clerk/expo';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const INVITATIONS_UPDATED_EVENT = 'rollcall:invitations-updated';
const INVITATIONS_POLL_MS = 15000;

interface Invitation {
  id: number;
}

export function notifyPendingInvitationsChanged() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(INVITATIONS_UPDATED_EVENT));
  }
}

export function usePendingInvitationsCount() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  const [count, setCount] = useState(0);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const refreshCount = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setCount(0);
      return;
    }

    try {
      const token = await getTokenRef.current({ template: 'RollCallAuth' });
      if (!token) {
        setCount(0);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/invitations/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invitations: ${response.status}`);
      }

      const invitations: Invitation[] = await response.json();
      setCount(invitations.length);
    } catch {
      setCount(0);
    }
  }, [isLoaded, isSignedIn]);

  useFocusEffect(
    useCallback(() => {
      void refreshCount();
    }, [refreshCount])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshCount();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshCount]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const handleInvitationsUpdated = () => {
      void refreshCount();
    };

    window.addEventListener(INVITATIONS_UPDATED_EVENT, handleInvitationsUpdated);
    return () => {
      window.removeEventListener(INVITATIONS_UPDATED_EVENT, handleInvitationsUpdated);
    };
  }, [refreshCount]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void refreshCount();
    }, INVITATIONS_POLL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshCount]);

  return {
    pendingInvitationsCount: count,
    refreshPendingInvitationsCount: refreshCount,
  };
}
