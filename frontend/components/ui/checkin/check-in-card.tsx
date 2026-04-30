import { FlatList, View, Text, TextInput, StyleSheet, Pressable, Platform, useWindowDimensions, Alert } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { ParticipantItem } from "./participant-item";
import { useCheckins } from "@/hooks/useCheckins";
import TabSwitcher from "./tab-switcher";
import CheckinCounter from "./checkin-counter";
import { useRouter } from 'expo-router';
import { checkinService } from "@/services/checkinService";

type CheckInCardProps = {
  eventId: string;
  tripId: string;
  isOrganizer: boolean;
  token?: string | null;
};

export function CheckInCard({ eventId, tripId, isOrganizer, token }: CheckInCardProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { checkedIn, notCheckedIn, participants, event, refetch, error } = useCheckins(eventId, token, tripId);
  const [activeTab, setActiveTab] = useState<'checked_in' | 'not_checked_in'>('checked_in');
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [sessionClosedNotice, setSessionClosedNotice] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const hideNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;

  // End check-in session handler
  const handleEndSession = async () => {
    setEndingSession(true);
    try {
      await checkinService.stopCheckinSession(eventId, 'self', token);
      router.push('/(tabs)/events');
      Alert.alert(
        'Check-in session stopped',
        'The check in session is now stopped. You can now close the window',
      );
      await refetch();
    } catch (e) {
      Alert.alert('Failed to end session', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setEndingSession(false);
    }
  };

  useEffect(() => {
    return () => {
      if (hideNoticeTimer.current) {
        clearTimeout(hideNoticeTimer.current);
      }
    };
  }, []);

  const list = activeTab === 'checked_in' ? checkedIn : notCheckedIn;
  const filtered = list.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (id: number, value: boolean) => {
    try {
      setIsSaving(true);
      if (value) {
        await checkinService.participantCheckIn(eventId, id, token);
      } else {
        await checkinService.participantUncheckIn(eventId, id, token);
      }

      if (isOrganizer && value) {
        const activeSession = await checkinService.getActiveSessionForEvent(eventId, 'self', token);
        if (!activeSession.isActive) {
          setSessionClosedNotice(true);
          if (hideNoticeTimer.current) {
            clearTimeout(hideNoticeTimer.current);
          }
          hideNoticeTimer.current = setTimeout(() => {
            setSessionClosedNotice(false);
          }, 5000);
        }
      }

      await refetch();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {isOrganizer && (
        <Pressable
          onPress={() => {
            router.push('/(tabs)/events');
          }}
          style={styles.exitButtonAbsolute}
          accessibilityLabel="Close check-in"
        >
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#888' }}>×</Text>
        </Pressable>
      )}
      {/* ...existing code... */}
      <Text style={styles.title}>{event.title}</Text>
      {sessionClosedNotice ? (
        <Text style={styles.noticeText}>All participants are checked in. Session closed automatically.</Text>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TabSwitcher
        activeTab={activeTab}
        onTabChange={setActiveTab}
        checkedInCount={checkedIn.length}
        notCheckedInCount={notCheckedIn.length}
      />

      <TextInput
        placeholder="Search for..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      <FlatList                       
        data={filtered}
        keyExtractor={p => String(p.id)}
        style={{ flex: 1 }}              
        renderItem={({ item }) => (
          <ParticipantItem
            participant={item}
            isOrganizer={isOrganizer}
            onToggle={handleToggle}
          />
        )}
      />

      {isOrganizer && (
        <Pressable
          onPress={handleEndSession}
          style={({ pressed }) => [
            styles.endSessionButtonFull,
            pressed && { opacity: 0.7 },
            endingSession && { backgroundColor: '#ccc' },
          ]}
          disabled={endingSession}
          accessibilityLabel="End check-in session"
        >
          <Text style={styles.endSessionButtonTextFull}>{endingSession ? '...' : 'Stop Check-in'}</Text>
        </Pressable>
      )}
      <CheckinCounter
        checked={checkedIn.length}
        total={participants.length}
      />
      {isSaving ? <Text style={styles.savingText}>Updating check-in status...</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  endSessionButtonFull: {
    backgroundColor: '#f2f2f2', // light gray
    borderColor: '#444', // dark gray
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    maxWidth: 220,
    width: '80%',
  },
  endSessionButtonTextFull: {
    color: '#444', // dark gray
    fontWeight: '700',
    fontSize: 16,
  },
  exitButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  exitButtonAbsolute: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  endSessionButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 0,
    backgroundColor: '#b0413e',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  endSessionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  search: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
        paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
  },
  savingText: {
    textAlign: 'center',
    color: '#4a7ca8',
    marginBottom: 12,
    fontWeight: '600',
  },
  infoText: {
    textAlign: 'center',
    color: '#4a7ca8',
    marginBottom: 8,
    fontWeight: '600',
  },
  noticeText: {
    textAlign: 'center',
    color: '#1b5e20',
    backgroundColor: '#d9f2dd',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    color: '#b0413e',
    marginBottom: 8,
    fontWeight: '600',
  },
});
