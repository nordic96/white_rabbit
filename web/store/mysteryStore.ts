import { MysteryDetail } from '@/types';
import { fetchApi, ResourceNotFoundError } from '@/utils';
import { create } from 'zustand';

interface MysteryState {
  selectedId: string | null;
  cache: Record<string, MysteryDetail>;
  isLoading: boolean;
  error: string | null;
}

const initialState: MysteryState = {
  selectedId: null,
  cache: {},
  isLoading: false,
  error: null,
};

type MysteryStore = MysteryState & {
  setSelectedId: (id: string) => void;
  unSelect: () => void;
  fetchMysteryDetail: (id: string) => Promise<void>;
  reset: () => void;
};

export const useMysteryStore = create<MysteryStore>()((set, get) => ({
  ...initialState,

  setSelectedId: (id: string) => {
    set({ selectedId: id, error: null });

    // Check cache before fetching
    const cached = get().cache[id];
    if (!cached) {
      get().fetchMysteryDetail(id);
    }
  },

  unSelect: () => set({ selectedId: null, error: null }),

  fetchMysteryDetail: async (id: string) => {
    set({ isLoading: true, error: null });

    const result = await fetchApi<MysteryDetail>(`/api/mysteries/${id}`);

    if (result.ok) {
      set((state) => ({
        cache: { ...state.cache, [id]: result.data },
        isLoading: false,
      }));
    } else {
      const errorMessage =
        result.error instanceof ResourceNotFoundError
          ? 'Mystery not found'
          : result.error.message;

      set({ error: errorMessage, isLoading: false });
      console.error('Failed to fetch mystery:', result.error);
    }
  },

  reset: () => set(initialState),
}));
