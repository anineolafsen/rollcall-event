import {
  formatAttendanceMode,
  formatEventDate,
  formatEventTime,
  getEventTimestamp,
  getUpcomingEvents,
  isEventWithinNext24Hours,
} from '@/lib/event-format';
import type { EventRecord } from '@/lib/events';

describe('Event Format - Unit Tests', () => {
  describe('Formatting helpers', () => {
    it('should return a timestamp for valid event dates', () => {
      expect(getEventTimestamp('2026-01-15T13:05:00')).toBe(new Date('2026-01-15T13:05:00').getTime());
    });

    it('should return positive infinity for invalid event dates', () => {
      expect(getEventTimestamp('not-a-date')).toBe(Number.POSITIVE_INFINITY);
    });

    it('should format valid event dates and times', () => {
      expect(formatEventDate('2026-01-15T13:05:00')).toBe('15 Jan 2026');
      expect(formatEventTime('2026-01-15T13:05:00')).toBe('13:05');
    });

    it('should return fallback labels for invalid date values', () => {
      expect(formatEventDate('invalid')).toBe('Date unavailable');
      expect(formatEventTime('invalid')).toBe('Time unavailable');
    });

    it('should format attendance mode labels', () => {
      expect(formatAttendanceMode('signup-required')).toBe('Signup Required');
      expect(formatAttendanceMode(undefined)).toBe('Not specified');
    });
  });

  describe('Event time windows', () => {
    const now = new Date('2026-05-06T10:00:00Z').getTime();

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(now);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should detect events starting within the next 24 hours', () => {
      expect(
        isEventWithinNext24Hours({
          startDate: '2026-05-06T18:00:00Z',
          endDate: '2026-05-06T20:00:00Z',
        })
      ).toBe(true);
    });

    it('should detect events already in progress', () => {
      expect(
        isEventWithinNext24Hours({
          startDate: '2026-05-06T09:00:00Z',
          endDate: '2026-05-06T12:00:00Z',
        })
      ).toBe(true);
    });

    it('should exclude events outside the next 24 hours', () => {
      expect(
        isEventWithinNext24Hours({
          startDate: '2026-05-07T12:30:00Z',
          endDate: '2026-05-07T13:30:00Z',
        })
      ).toBe(false);
    });
  });

  describe('Upcoming event sorting', () => {
    it('should filter out finished events and sort remaining events by start date', () => {
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-05-06T10:00:00Z').getTime());

      const events: EventRecord[] = [
        {
          id: 1,
          name: 'Finished',
          startDate: '2026-05-06T06:00:00Z',
          endDate: '2026-05-06T08:00:00Z',
          tripId: 10,
        },
        {
          id: 2,
          name: 'Later',
          startDate: '2026-05-06T18:00:00Z',
          endDate: '2026-05-06T20:00:00Z',
          tripId: 10,
        },
        {
          id: 3,
          name: 'Sooner',
          startDate: '2026-05-06T12:00:00Z',
          endDate: '2026-05-06T13:00:00Z',
          tripId: 10,
        },
      ];

      expect(getUpcomingEvents(events).map((event) => event.id)).toEqual([3, 2]);

      jest.restoreAllMocks();
    });
  });
});
