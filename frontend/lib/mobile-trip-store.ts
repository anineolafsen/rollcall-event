import { create } from 'zustand';
import type { EventRecord } from '@/lib/events';

export type MobileTrip = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isOrganizer?: boolean;
  destination?: string;
  description?: string;
};

type MobileTripStore = {
  selectedTripId: number | null;
  selectedTripName: string | null;
  selectedTripIsOrganizer: boolean;
  trips: MobileTrip[];
  tripsLoaded: boolean;
  eventsByTrip: Record<string, EventRecord[]>;
  setSelectedTrip: (trip: { id: number | null; name?: string | null; isOrganizer?: boolean }) => void;
  setTrips: (trips: MobileTrip[]) => void;
  clearTrips: () => void;
  setTripEvents: (tripId: string | number, events: EventRecord[]) => void;
  clearTripEvents: () => void;
};

export const useMobileTripStore = create<MobileTripStore>((set) => ({
  selectedTripId: null,
  selectedTripName: null,
  selectedTripIsOrganizer: false,
  trips: [],
  tripsLoaded: false,
  eventsByTrip: {},
  setSelectedTrip: ({ id, name = null, isOrganizer = false }) =>
    set({ selectedTripId: id, selectedTripName: name, selectedTripIsOrganizer: isOrganizer }),
  setTrips: (trips) => set({ trips, tripsLoaded: true }),
  clearTrips: () => set({ trips: [], tripsLoaded: false }),
  setTripEvents: (tripId, events) =>
    set((state) => ({
      eventsByTrip: {
        ...state.eventsByTrip,
        [String(tripId)]: events,
      },
    })),
  clearTripEvents: () => set({ eventsByTrip: {} }),
}));
