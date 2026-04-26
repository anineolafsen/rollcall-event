import { create } from 'zustand';

type MobileTripStore = {
  selectedTripId: number | null;
  setSelectedTripId: (tripId: number | null) => void;
};

export const useMobileTripStore = create<MobileTripStore>((set) => ({
  selectedTripId: null,
  setSelectedTripId: (tripId) => set({ selectedTripId: tripId }),
}));
