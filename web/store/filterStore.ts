import { create } from 'zustand';

type SetFilterFunc = (filterId: string) => void;

interface InitialState {
  filterId: string | null;
}

const initialState: InitialState = {
  filterId: null,
};

type FilterStore = InitialState & {
  setFilter: SetFilterFunc;
  unSelectFilter: () => void;
};

export const useFilterStore = create<FilterStore>()((set) => ({
  ...initialState,
  setFilter: (filterId: string) => set({ filterId: filterId }),
  unSelectFilter: () => set({ filterId: null }),
}));
