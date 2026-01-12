import {
  ApiMysteryListResponse,
  CATEGORY_ID_PREFIX,
  LOCATION_ID_PREFIX,
  MysteryItem,
  TIMEPERIOD_ID_PREFIX,
} from '@/types';
import { fetchApi } from '@/utils';
import { create } from 'zustand';

let currentController: AbortController | null = null;

interface FilterState {
  filterId: string | null;
  filteredMysteries: MysteryItem[];
  error: Error | string | null;
  loading: boolean;
}

interface FilterActions {
  setFilter: (filterId: string) => Promise<void>;
  unSelectFilter: () => void;
}

type FilterStore = FilterState & FilterActions;

const initialState: FilterState = {
  filterId: null,
  filteredMysteries: [],
  error: null,
  loading: false,
};

export const useFilterStore = create<FilterStore>()((set) => ({
  ...initialState,

  setFilter: async (filterId: string) => {
    // Abort any pending request
    if (currentController) {
      currentController.abort();
    }

    // Create new controller for this request
    currentController = new AbortController();
    const controller = currentController;
    set({ filterId, error: null, loading: true, filteredMysteries: [] });

    const baseUrl = window.location.href;
    const apiUrl = new URL('/api/mysteries', baseUrl);

    if (filterId.startsWith(CATEGORY_ID_PREFIX)) {
      apiUrl.searchParams.append('category_id', filterId);
    } else if (filterId.startsWith(LOCATION_ID_PREFIX)) {
      apiUrl.searchParams.append('location_id', filterId);
    } else if (filterId.startsWith(TIMEPERIOD_ID_PREFIX)) {
      apiUrl.searchParams.append('time_period_id', filterId);
    }

    try {
      const res = await fetchApi<ApiMysteryListResponse>(apiUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Error fetching mysteries with ${filterId}`);
      }

      const data = res.data;
      set({ filteredMysteries: data.mysteries || [], loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e : String(e),
        loading: false,
      });
    }
  },

  unSelectFilter: () => {
    // Also abort when unselecting
    if (currentController) {
      currentController.abort();
      currentController = null;
    }
    set({ filterId: null });
  },
}));
