import { create } from 'zustand';

interface MysteryState {
  selectedId: null | string;
}

const initialState: MysteryState = {
  selectedId: null,
};

type MysteryStore = MysteryState & {
  setSelectedId: (id: string) => void;
  unSelect: () => void;
  reset: () => void;
};

export const useMysteryStore = create<MysteryStore>()((set) => ({
  ...initialState,
  setSelectedId: (id: string) => {
    set({ selectedId: id });
  },
  unSelect: () => set({ selectedId: null }),
  reset: () => set(initialState),
}));
