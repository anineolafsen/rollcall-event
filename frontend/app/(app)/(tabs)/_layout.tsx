import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, type AppStateStatus, Platform, View, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { AppNavbar } from '@/components/ui/nav-bar';
import { AppSidebar } from '@/components/ui/side-bar';
import { useAuth } from '@clerk/expo';
import { checkinService, type EventParticipantStatus } from '@/services/checkinService';
import { getEventById } from '@/lib/events';
import { CheckinSessionModal } from '@/components/ui/checkin/checkin-session-modal';

export default function TabLayout() {
  const POLL_BACKOFF_MS = 60000;
  const ACTIVE_POLL_MS = 5000;
  const IDLE_POLL_MS = 15000;

  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  const router = useRouter();
  const { userId, getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);

  const [modalVisible, setModalVisible] = useState(false);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [activeEventName, setActiveEventName] = useState<string>('');
  const [activeTripId, setActiveTripId] = useState<number | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [dismissedEventId, setDismissedEventId] = useState<number | null>(null);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const dismissedEventIdRef = useRef<number | null>(null);
  const modalVisibleRef = useRef(false);
  const pausedUntilRef = useRef(0);
  const failureCountRef = useRef(0);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    dismissedEventIdRef.current = dismissedEventId;
  }, [dismissedEventId]);

  useEffect(() => {
    modalVisibleRef.current = modalVisible;
  }, [modalVisible]);

  const isAuthOrNetworkError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();
    return (
      lower.includes('401') ||
      lower.includes('unauthorized') ||
      lower.includes('network') ||
      lower.includes('failed to fetch') ||
      lower.includes('connection_refused')
    );
  }, []);

  const shouldPausePolling = useCallback(() => Date.now() < pausedUntilRef.current, []);

  const recordPollFailure = useCallback((error: unknown) => {
    if (!isAuthOrNetworkError(error)) {
      failureCountRef.current = 0;
      return;
    }

    failureCountRef.current += 1;
    if (failureCountRef.current >= 2) {
      pausedUntilRef.current = Date.now() + POLL_BACKOFF_MS;
    }
  }, [POLL_BACKOFF_MS, isAuthOrNetworkError]);

  const clearPollBackoff = useCallback(() => {
    pausedUntilRef.current = 0;
    failureCountRef.current = 0;
  }, []);

  const refreshActiveCheckin = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !userId || !isPageVisible) {
      return;
    }

    if (shouldPausePolling()) {
      return;
    }

    try {
      const token = await getTokenRef.current({ template: 'RollCallAuth' });
      if (!token) {
        recordPollFailure(new Error('401: missing auth token'));
        return;
      }

      const lookup = await checkinService.getActiveSessionsForUser(userId, token);
      const nextEventId = lookup.eventIds.length > 0 ? lookup.eventIds[0] : null;

      if (!nextEventId) {
        setActiveEventId(null);
        setActiveEventName('');
        setActiveTripId(null);
        setModalVisible(false);
        setDismissedEventId(null);
        return;
      }

      const eventDetails = await getEventById(nextEventId, token);
      const participants = await checkinService.getEventParticipants(nextEventId, token);
      const me = participants.find((p: EventParticipantStatus) => p.userID === userId);
      const alreadyCheckedIn = Boolean(me?.isCheckedIn);

      setActiveEventId(nextEventId);
      setActiveEventName(eventDetails.name);
      setActiveTripId(eventDetails.tripId ?? null);

      if (alreadyCheckedIn) {
        setDismissedEventId(nextEventId);
        setModalVisible(false);
        return;
      }

      if (dismissedEventIdRef.current !== nextEventId && !modalVisibleRef.current) {
        setModalVisible(true);
        Alert.alert('Check-in started', `Check in for: ${eventDetails.name}`);
      }
      clearPollBackoff();
    } catch (error) {
      recordPollFailure(error);
      
    }
  }, [clearPollBackoff, isLoaded, isPageVisible, isSignedIn, recordPollFailure, shouldPausePolling, userId]);

  useEffect(() => {
    void refreshActiveCheckin();
  }, [refreshActiveCheckin]);

  useEffect(() => {
    if (!isPageVisible) {
      return;
    }

    const pollMs = activeEventId ? ACTIVE_POLL_MS : IDLE_POLL_MS;
    const intervalId = setInterval(() => {
      void refreshActiveCheckin();
    }, pollMs);

    return () => clearInterval(intervalId);
  }, [activeEventId, isPageVisible, refreshActiveCheckin]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshActiveCheckin();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [refreshActiveCheckin]);

  const handleCheckIn = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !activeEventId || !userId) {
      return;
    }

    try {
      setIsCheckingIn(true);
      const token = await getTokenRef.current({ template: 'RollCallAuth' });
      if (!token) {
        Alert.alert('Authentication required', 'Please sign in again and retry check-in.');
        return;
      }

      const participants = await checkinService.getEventParticipants(activeEventId, token);
      const me = participants.find((p: EventParticipantStatus) => p.userID === userId);

      if (!me) {
        Alert.alert('Not available', 'You are not eligible to check in for this event.');
        return;
      }

      await checkinService.participantCheckIn(activeEventId, me.participantID, token);
      clearPollBackoff();

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rollcall:participant-checked-in', {
          detail: { eventId: activeEventId },
        }));
      }

      setDismissedEventId(activeEventId);
      setModalVisible(false);
      Alert.alert('Checked in', 'You are now marked as checked in.');
    } catch {
      Alert.alert('Error', 'Could not complete check-in. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  }, [activeEventId, clearPollBackoff, isLoaded, isSignedIn, userId]);

  const handleContact = useCallback(() => {
    if (activeTripId) {
      router.push(`/trips/${activeTripId}` as any);
    }
    if (activeEventId) {
      setDismissedEventId(activeEventId);
    }
    setModalVisible(false);
  }, [activeEventId, activeTripId, router]);

  const handleCloseModal = useCallback(() => {
    if (activeEventId) {
      setDismissedEventId(activeEventId);
    }
    setModalVisible(false);
  }, [activeEventId]);

  if (isDesktopWeb) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <AppSidebar />
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
          <CheckinSessionModal
            visible={modalVisible}
            eventName={activeEventName}
            onCheckIn={handleCheckIn}
            onContact={handleContact}
            onClose={handleCloseModal}
            checkingIn={isCheckingIn}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
      <AppNavbar />
      <CheckinSessionModal
        visible={modalVisible}
        eventName={activeEventName}
        onCheckIn={handleCheckIn}
        onContact={handleContact}
        onClose={handleCloseModal}
        checkingIn={isCheckingIn}
      />
    </View>
  );
}
