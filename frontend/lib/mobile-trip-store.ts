import { create } from 'zustand';

type MobileTripStore = {
  selectedTripId: number | null;
  selectedTripName: string | null;
  selectedTripIsOrganizer: boolean;
  setSelectedTrip: (trip: { id: number | null; name?: string | null; isOrganizer?: boolean }) => void;
};

export const useMobileTripStore = create<MobileTripStore>((set) => ({
  selectedTripId: null,
  selectedTripName: null,
  selectedTripIsOrganizer: false,
  setSelectedTrip: ({ id, name = null, isOrganizer = false }) =>
    set({ selectedTripId: id, selectedTripName: name, selectedTripIsOrganizer: isOrganizer }),
}));
