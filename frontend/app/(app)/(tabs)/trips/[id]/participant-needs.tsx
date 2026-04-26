import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@clerk/expo';
import { getParticipantNeeds, type ParticipantNeedsDto } from '@/lib/participants';

export default function ParticipantNeedsScreen() {
  const { id, tripName } = useLocalSearchParams<{ id: string; tripName?: string }>();
  const router = useRouter();
  const { getToken } = useAuth();

  const [participants, setParticipants] = useState<ParticipantNeedsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken({ template: 'RollCallAuth' });
        const data = await getParticipantNeeds(Number(id), token);
        setParticipants(data);
      } catch {
        setError('Could not load participant needs.');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const withNeeds = participants.filter(
    (p) => p.allergies?.trim() || p.otherInfo?.trim()
  );
  const withoutNeeds = participants.filter(
    (p) => !p.allergies?.trim() && !p.otherInfo?.trim()
  );

  const displayName = (p: ParticipantNeedsDto) =>
    p.name.trim() || p.email;

  const renderWithNeeds = ({ item }: { item: ParticipantNeedsDto }) => (
    <View style={styles.card}>
      <Text style={styles.participantName}>{displayName(item)}</Text>
      {item.allergies?.trim() ? (
        <View style={styles.needRow}>
          <Text style={styles.needLabel}>Allergies</Text>
          <Text style={styles.needValue}>{item.allergies}</Text>
        </View>
      ) : null}
      {item.otherInfo?.trim() ? (
        <View style={styles.needRow}>
          <Text style={styles.needLabel}>Other info</Text>
          <Text style={styles.needValue}>{item.otherInfo}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderWithoutNeeds = ({ item }: { item: ParticipantNeedsDto }) => (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyName}>{displayName(item)}</Text>
      <Text style={styles.emptyTag}>No special needs</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Go back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Participant Needs</Text>
        {tripName ? <Text style={styles.tripName}>{tripName}</Text> : null}
        <View style={styles.divider} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#76b6ee" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Summary pill */}
              <View style={styles.summaryRow}>
                <View style={[styles.pill, withNeeds.length > 0 ? styles.pillAlert : styles.pillOk]}>
                  <Text style={[styles.pillText, withNeeds.length > 0 ? styles.pillTextAlert : styles.pillTextOk]}>
                    {withNeeds.length} of {participants.length} have special needs
                  </Text>
                </View>
              </View>

              {withNeeds.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Special needs</Text>
                  {withNeeds.map((item) => (
                    <View key={item.userId}>{renderWithNeeds({ item })}</View>
                  ))}
                </>
              )}

              {withoutNeeds.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: withNeeds.length > 0 ? 24 : 0 }]}>
                    No special needs
                  </Text>
                  {withoutNeeds.map((item) => (
                    <View key={item.userId}>{renderWithoutNeeds({ item })}</View>
                  ))}
                </>
              )}

              {participants.length === 0 && (
                <View style={styles.centered}>
                  <Text style={styles.emptyText}>No participants yet.</Text>
                </View>
              )}
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef5fb',
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#eef5fb',
    borderBottomWidth: 1,
    borderBottomColor: '#d9e8f5',
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 15,
    color: '#4a7ca8',
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#090909',
    marginBottom: 2,
  },
  tripName: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 14,
  },
  divider: {
    height: 2,
    backgroundColor: '#76b6ee',
    borderRadius: 999,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 40,
  },
  summaryRow: {
    marginBottom: 20,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillAlert: {
    backgroundColor: '#fef3c7',
  },
  pillOk: {
    backgroundColor: '#dcfce7',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextAlert: {
    color: '#92400e',
  },
  pillTextOk: {
    color: '#166534',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4a7ca8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  participantName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#090909',
    marginBottom: 8,
  },
  needRow: {
    marginBottom: 6,
  },
  needLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7a9ab8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  needValue: {
    fontSize: 14,
    color: '#1a3d5c',
    lineHeight: 20,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d9e8f5',
  },
  emptyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  emptyTag: {
    fontSize: 12,
    color: '#9ca3af',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  errorText: {
    fontSize: 14,
    color: '#b0413e',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#7a9ab8',
  },
});
