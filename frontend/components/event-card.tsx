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
    <View style={[styles.card, isStartingSoon && styles.cardSoon]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.cardHeader, isStartingSoon && styles.cardHeaderSoon]}>
          <View style={styles.headingBlock}>
            <Text style={styles.eventName}>{event.name}</Text>
          </View>
          {isStartingSoon ? (
            <View style={styles.soonBadge}>
              <Text style={styles.soonBadgeText}>Within 24h</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.headerDivider} />

        <View style={styles.metaBlock}>
          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Date & time</Text>
              <Text style={styles.metaValue}>
                {formatEventDate(event.startDate)} · {formatEventTime(event.startDate)}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Participants</Text>
              <Text style={styles.metaValue}>{participantCounter}</Text>
            </View>
          </View>
          {event.location ? (
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Location</Text>
              <Text style={styles.metaValue}>{event.location}</Text>
            </View>
          ) : null}
        </View>

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
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d0e5f7',
    overflow: 'hidden',
  },
  cardSoon: {
    borderColor: '#f0b429',
  },
  cardHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headingBlock: {
    flex: 1,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a3d5c',
  },
  soonBadge: {
    backgroundColor: '#f0b429',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  soonBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3f2a00',
    textTransform: 'uppercase',
  },
  cardDivider: {
    display: 'none' as any,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metaBlock: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 10,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metaCell: {
    flex: 1,
    gap: 3,
  },
  metaLabel: {
    fontSize: 11,
    lineHeight: 20,
    color: '#7a9ab8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: 14,
    color: '#1a3d5c',
    fontWeight: '600',
  },
  location: {
    paddingTop: 10,
    fontSize: 14,
    color: '#4a7ca8',
    fontWeight: '500',
    paddingHorizontal: 18,
  },
  actionButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionButtonStart: {
    backgroundColor: '#eaf7ec',
    borderColor: '#4c915f',
  },
  actionButtonActive: {
    backgroundColor: '#f0f6fc',
    borderColor: '#7e8d9a',
  },
  actionButtonCheckedIn: {
    backgroundColor: '#f0f6fc',
    borderColor: '#7e8d9a',
  },
  actionButtonJoin: {
    backgroundColor: '#eaf7ec',
    borderColor: '#4c915f',
  },
  actionButtonLeave: {
    backgroundColor: '#fff0f1',
    borderColor: '#d45162',
  },
  actionButtonMandatory: {
    backgroundColor: '#fafadc',
    borderColor: '#a9ac5f',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#1a3d1a',
    fontSize: 20,
    fontWeight: '700',
  },
  actionButtonTextLeave: {
    color: '#b0192a',
  },
  actionButtonTextMandatory: {
    color: '#5a5a00',
  },
  headerDivider: {
  height: 2,
  backgroundColor: '#d0e5f7',
  marginHorizontal: 18,
  marginBottom: 4,
},
});
