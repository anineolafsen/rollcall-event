import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, type AppStateStatus, Platform, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { AppNavbar } from '@/components/ui/nav-bar';
import { AppSidebar } from '@/components/ui/side-bar';
import { useAuth } from '@clerk/expo';
import { checkinService, type EventParticipantStatus } from '@/services/checkinService';
import { getEventById } from '@/lib/events';
import { CheckinSessionModal } from '@/components/ui/checkin/checkin-session-modal';

export default function TabLayout() {
  const isWeb = Platform.OS === 'web';
  const router = useRouter();
  const { userId, getToken } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [activeEventName, setActiveEventName] = useState<string>('');
  const [activeTripId, setActiveTripId] = useState<number | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [dismissedEventId, setDismissedEventId] = useState<number | null>(null);

  const refreshActiveCheckin = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const token = await getToken({ template: 'RollCallAuth' });
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

      if (dismissedEventId !== nextEventId && !modalVisible) {
        setModalVisible(true);
        Alert.alert('Check-in started', `Check in for: ${eventDetails.name}`);
      }
    } catch {
      // Keep silent to avoid interrupting app use on transient network errors.
    }
  }, [dismissedEventId, getToken, modalVisible, userId]);

  useEffect(() => {
    void refreshActiveCheckin();
  }, [refreshActiveCheckin]);

  useEffect(() => {
    const pollMs = activeEventId ? 5000 : 15000;
    const intervalId = setInterval(() => {
      void refreshActiveCheckin();
    }, pollMs);

    return () => clearInterval(intervalId);
  }, [activeEventId, refreshActiveCheckin]);

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
    if (!activeEventId || !userId) {
      return;
    }

    try {
      setIsCheckingIn(true);
      const token = await getToken({ template: 'RollCallAuth' });
      const participants = await checkinService.getEventParticipants(activeEventId, token);
      const me = participants.find((p: EventParticipantStatus) => p.userID === userId);

      if (!me) {
        Alert.alert('Not available', 'You are not eligible to check in for this event.');
        return;
      }

      await checkinService.participantCheckIn(activeEventId, me.participantID, token);
      setDismissedEventId(activeEventId);
      setModalVisible(false);
      Alert.alert('Checked in', 'You are now marked as checked in.');
    } catch {
      Alert.alert('Error', 'Could not complete check-in. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  }, [activeEventId, getToken, userId]);

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

  if (isWeb) {
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