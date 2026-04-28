import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

import { formatEventDate, formatEventTime, isEventWithinNext24Hours } from '@/lib/event-format';
import type { EventRecord } from '@/lib/events';

type EventCardProps = {
  event: EventRecord;
  onPress: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
  actionDisabled?: boolean;
  actionVariant?: 'start' | 'active' | 'checkedin' | 'join' | 'leave' | 'mandatory' | 'updating';
};

export function EventCard({
  event,
  onPress,
  actionLabel,
  onActionPress,
  actionDisabled = false,
  actionVariant = 'join',
}: EventCardProps) {
  const isStartingSoon = isEventWithinNext24Hours(event);
  const isEmergency = Boolean(event.isEmergency);

  const tripTotal = event.tripParticipantCount ?? 0;
  const joinedCount = event.participantCount ?? 0;

  const participantCounter = (() => {
    if (event.attendanceMode === 'mandatory') {
      const total = tripTotal;
      return `${total}/${total}`;
    }

    if (event.hasUnlimitedCapacity || !event.capacity) {
      const total = tripTotal;
      return `${joinedCount}/${total}`;
    }

    return `${joinedCount}/${event.capacity}`;
  })();

  return (
    <View
      style={[
        styles.card,
        isEmergency
          ? styles.cardEmergency
          : isStartingSoon && styles.cardSoon,
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <View style={styles.headingBlock}>
            {isEmergency ? (
              <View style={styles.emergencyBadge}>
                <Text style={styles.emergencyBadgeText}>EMERGENCY</Text>
              </View>
            ) : null}

            <Text style={styles.eventName}>{event.name}</Text>
          </View>

          {isStartingSoon && !isEmergency ? (
            <View style={styles.soonBadge}>
              <Text style={styles.soonBadgeText}>Within 24h</Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.cardDivider,
            isEmergency
              ? styles.cardDividerEmergency
              : isStartingSoon && styles.cardDividerSoon,
          ]}
        />

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date:</Text>
            <Text style={styles.metaValue}>{formatEventDate(event.startDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Time:</Text>
            <Text style={styles.metaValue}>{formatEventTime(event.startDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Participants:</Text>
            <Text style={styles.metaValue}>{participantCounter}</Text>
          </View>
        </View>

        {event.location ? <Text style={styles.location}>Location: {event.location}</Text> : null}
      </TouchableOpacity>

      {actionLabel && onActionPress ? (
        <TouchableOpacity
          style={[
            styles.actionButton,
            actionVariant === 'start' && styles.actionButtonStart,
            actionVariant === 'active' && styles.actionButtonActive,
            actionVariant === 'checkedin' && styles.actionButtonCheckedIn,
            actionVariant === 'join' && styles.actionButtonJoin,
            actionVariant === 'leave' && styles.actionButtonLeave,
            actionVariant === 'mandatory' && styles.actionButtonMandatory,
            actionVariant === 'updating' && styles.actionButtonUpdating,
            isEmergency && styles.actionButtonEmergency,
            actionDisabled && styles.actionButtonDisabled,
          ]}
          onPress={onActionPress}
          disabled={actionDisabled}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.actionButtonText,
              actionVariant === 'leave' && styles.actionButtonTextLeave,
              actionVariant === 'mandatory' && styles.actionButtonTextMandatory,
            ]}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#c7e2f8',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 4,
    borderColor: '#75baf0',
    gap: 10,
  },
  cardSoon: {
    backgroundColor: '#fff2c7',
    borderColor: '#f0b429',
    shadowColor: '#f0b429',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },
  cardEmergency: {
    backgroundColor: '#fde8e8',
    borderColor: '#e03131',
  },
  cardHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headingBlock: {
    flex: 1,
  },
  emergencyBadge: {
    backgroundColor: '#e03131',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  emergencyBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  eventName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#090909',
  },
  soonBadge: {
    backgroundColor: '#f0b429',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  soonBadgeText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
    color: '#3f2a00',
    textTransform: 'uppercase',
  },
  cardDivider: {
    height: 4,
    width: '72%',
    backgroundColor: '#3b3b3b',
    marginBottom: 18,
  },
  cardDividerSoon: {
    backgroundColor: '#c78300',
  },
  cardDividerEmergency: {
    backgroundColor: '#e03131',
  },
  metaBlock: {
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metaLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6e7c89',
    marginRight: 6,
  },
  metaValue: {
    fontSize: 14,
    lineHeight: 20,
    color: '#090909',
    fontWeight: '700',
  },
  location: {
    marginTop: 16,
    fontSize: 13,
    lineHeight: 19,
    color: '#23425f',
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 2,
    alignSelf: 'flex-end',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
  actionButtonStart: {
    backgroundColor: '#77c88a',
    borderColor: '#4c915f',
  },
  actionButtonActive: {
    backgroundColor: '#ffffff',
    borderColor: '#7e8d9a',
  },
  actionButtonCheckedIn: {
    backgroundColor: '#ffffff',
    borderColor: '#7e8d9a',
  },
  actionButtonJoin: {
    backgroundColor: '#77c88a',
    borderColor: '#4c915f',
  },
  actionButtonLeave: {
    backgroundColor: '#ff6f80',
    borderColor: '#d45162',
  },
  actionButtonMandatory: {
    backgroundColor: '#d9dd8a',
    borderColor: '#a9ac5f',
  },
  actionButtonUpdating: {
    backgroundColor: '#a9b7c4',
    borderColor: '#7e8d9a',
  },
  actionButtonEmergency: {
    borderColor: '#e03131',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  actionButtonTextLeave: {
    color: '#111111',
  },
  actionButtonTextMandatory: {
    color: '#111111',
  },
});