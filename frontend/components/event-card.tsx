import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

import { formatEventDate, formatEventTime, isEventWithinNext24Hours } from '@/lib/event-format';
import type { EventRecord } from '@/lib/events';

type EventCardProps = {
  event: EventRecord;
  onPress: () => void;
};

export function EventCard({ event, onPress }: EventCardProps) {
  const isStartingSoon = isEventWithinNext24Hours(event);

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.card, isStartingSoon && styles.cardSoon]}>
        <View style={styles.cardHeader}>
          <View style={styles.headingBlock}>
            <Text style={styles.eventName}>{event.name}</Text>
          </View>
          {isStartingSoon ? (
            <View style={styles.soonBadge}>
              <Text style={styles.soonBadgeText}>Within 24h</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.cardDivider, isStartingSoon && styles.cardDividerSoon]} />

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date:</Text>
            <Text style={styles.metaValue}>{formatEventDate(event.startDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Time:</Text>
            <Text style={styles.metaValue}>{formatEventTime(event.startDate)}</Text>
          </View>
        </View>

        {event.location ? <Text style={styles.location}>Location: {event.location}</Text> : null}
      </View>
    </TouchableOpacity>
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
});
