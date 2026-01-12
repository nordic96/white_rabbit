import {
  CATEGORY_ID_PREFIX,
  LOCATION_ID_PREFIX,
  MysteryItem,
  TIMEPERIOD_ID_PREFIX,
} from '@/types';
import { create } from 'zustand';

type SetFilterFunc = (filterId: string) => void;

interface InitialState {
  filterId: string | null;
  filteredMysteries: MysteryItem[];
  error: Error | string | null;
  loading: boolean;
}

const initialState: InitialState = {
  filterId: null,
  filteredMysteries: [],
  error: null,
  loading: false,
};

type FilterStore = InitialState & {
  setFilter: SetFilterFunc;
  setMysteries: (mysteries: MysteryItem[]) => void;
  unSelectFilter: () => void;
  setError: (error: Error | string) => void;
  setLoading: (loading: boolean) => void;
};

export const useFilterStore = create<FilterStore>()((set, get) => ({
  ...initialState,
  setMysteries: (mysteries: MysteryItem[]) =>
    set({ filteredMysteries: mysteries }),
  setError: (error: Error | string) => set({ error: error }),
  setLoading: (loading: boolean) => set({ loading: loading }),
  setFilter: (filterId: string) => {
    async function fetchMysteries(filterId: string) {
      const baseUrl = window.location.href;
      const apiUrl = new URL('/api/mysteries', baseUrl);
      if (filterId.startsWith(CATEGORY_ID_PREFIX)) {
        apiUrl.searchParams.append('category_id', filterId);
      } else if (filterId.startsWith(LOCATION_ID_PREFIX)) {
        apiUrl.searchParams.append('location_id', filterId);
      } else if (filterId.startsWith(TIMEPERIOD_ID_PREFIX)) {
        apiUrl.searchParams.append('time_period_id', filterId);
      }

      get().setLoading(true);
      await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(
              `Error while fetching mystery data with ${filterId}`,
            );
          }
          return res.json();
        })
        .then((data) => {
          get().setMysteries(data.mysteries || []);
        })
        .catch((e) => {
          get().setError(e);
        })
        .finally(() => get().setLoading(false));
    }
    set({ filterId: filterId });
    get().setMysteries([]);
    fetchMysteries(filterId);
  },
  unSelectFilter: () => set({ filterId: null }),
}));
