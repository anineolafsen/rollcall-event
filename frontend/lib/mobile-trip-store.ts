import { create } from 'zustand';

type MobileTripStore = {
  selectedTripId: number | null;
  selectedTripIsOrganizer: boolean;
  setSelectedTrip: (trip: { id: number | null; isOrganizer?: boolean }) => void;
};

export const useMobileTripStore = create<MobileTripStore>((set) => ({
  selectedTripId: null,
  selectedTripIsOrganizer: false,
  setSelectedTrip: ({ id, isOrganizer = false }) =>
    set({ selectedTripId: id, selectedTripIsOrganizer: isOrganizer }),
}));
