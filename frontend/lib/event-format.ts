import type { EventRecord } from '@/lib/events';

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getEventTimestamp(value: string) {
  const date = parseDate(value);
  return date ? date.getTime() : Number.POSITIVE_INFINITY;
}

export function formatEventDate(value: string) {
  const date = parseDate(value);

  if (!date) {
    return 'Date unavailable';
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatEventTime(value: string) {
  const date = parseDate(value);

  if (!date) {
    return 'Time unavailable';
  }

  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatAttendanceMode(value?: string) {
  if (!value) {
    return 'Not specified';
  }

  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getUpcomingEvents(events: EventRecord[]) {
  const now = Date.now();

  return events
    .filter((event) => getEventTimestamp(event.endDate) >= now)
    .sort((left, right) => getEventTimestamp(left.startDate) - getEventTimestamp(right.startDate));
}
