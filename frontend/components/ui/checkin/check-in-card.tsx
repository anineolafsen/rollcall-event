import { FlatList, View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import React, { useState } from "react";
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
  const { checkedIn, notCheckedIn, participants, event, refetch, loading, error } = useCheckins(eventId, token, tripId);
  const [activeTab, setActiveTab] = useState<'checked_in' | 'not_checked_in'>('checked_in');
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const list = activeTab === 'checked_in' ? checkedIn : notCheckedIn;
  const filtered = list.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (id: number, value: boolean) => {
    if (!value) {
      return;
    }

    try {
      setIsSaving(true);
      await checkinService.participantCheckIn(eventId, id, token);
      await refetch();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {isOrganizer && (
        <Pressable
          onPress={() => router.push({ pathname: '/trips/[id]', params: { id: tripId } })}
          style={{ position: 'absolute', top: 12, right: 16, zIndex: 10, padding: 8 }}
          accessibilityLabel="Close check-in"
        >
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#888' }}>×</Text>
        </Pressable>
      )}
      <Text style={styles.title}>{event.title}</Text>

      {loading ? <Text style={styles.infoText}>Loading participants...</Text> : null}
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

      <CheckinCounter
        checked={checkedIn.length}
        total={participants.length}
      />
      {isSaving ? <Text style={styles.savingText}>Updating check-in status...</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 16,
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
  errorText: {
    textAlign: 'center',
    color: '#b0413e',
    marginBottom: 8,
    fontWeight: '600',
  },
});