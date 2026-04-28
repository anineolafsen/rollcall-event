import { TouchableOpacity, View, Text, StyleSheet, Pressable } from 'react-native';

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
        <View style={[styles.cardHeader, isStartingSoon && styles.cardHeaderSoon]}>
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
            styles.headerDivider,
            isEmergency && styles.headerDividerEmergency,
            isStartingSoon && !isEmergency && styles.headerDividerSoon,
          ]}
        />

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
        <Pressable
          style={({ hovered, pressed }) => [
            styles.actionButton,
            actionVariant === 'start' && styles.actionButtonStart,
            actionVariant === 'active' && styles.actionButtonActive,
            actionVariant === 'checkedin' && styles.actionButtonCheckedIn,
            actionVariant === 'join' && styles.actionButtonJoin,
            actionVariant === 'leave' && styles.actionButtonLeave,
            actionVariant === 'mandatory' && styles.actionButtonMandatory,
            !actionDisabled && hovered && styles.actionButtonHovered,
            !actionDisabled && pressed && styles.actionButtonPressed,
            actionVariant === 'updating' && styles.actionButtonUpdating,
            isEmergency && styles.actionButtonEmergency,
            actionDisabled && styles.actionButtonDisabled,
            actionDisabled && styles.actionButtonDisabled,
          ]}
          onPress={onActionPress}
          disabled={actionDisabled}
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
        </Pressable>
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
  cardEmergency: {
    backgroundColor: '#fde8e8',
    borderColor: '#e03131',
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
  cardHeaderSoon: {
    backgroundColor: '#fff8e8',
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
    fontSize: 22,
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
  headerDivider: {
    height: 2,
    backgroundColor: '#d0e5f7',
    marginHorizontal: 18,
    marginBottom: 4,
  },
  headerDividerSoon: {
    backgroundColor: '#c78300',
  },
  headerDividerEmergency: {
    backgroundColor: '#e03131',
  },
  actionButtonUpdating: {
    backgroundColor: '#a9b7c4',
    borderColor: '#7e8d9a',
  },
  actionButtonEmergency: {
    borderColor: '#e03131',
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
    fontSize: 12,
    lineHeight: 20,
    color: '#7a9ab8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: 16,
    color: '#1a3d5c',
    fontWeight: '600',
  },
  location: {
    paddingTop: 10,
    fontSize: 16,
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
    shadowColor: '#2a4f73',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
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
  actionButtonHovered: {
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    transform: [{ translateY: -1 }],
  },
  actionButtonPressed: {
    opacity: 0.88,
    transform: [{ translateY: 0 }],
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
});