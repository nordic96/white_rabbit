import { SearchResponse, SearchResultItem } from '@/types';
import { fetchApi } from '@/utils';
import { create } from 'zustand';

const DEBOUNCE_MS = 300;

interface SearchState {
  query: string;
  results: SearchResultItem[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  activeIndex: number;
}

const initialState: SearchState = {
  query: '',
  results: [],
  isLoading: false,
  error: null,
  isOpen: false,
  activeIndex: -1,
};

type SearchStore = SearchState & {
  setQuery: (query: string) => void;
  search: (query: string) => Promise<void>;
  setIsOpen: (isOpen: boolean) => void;
  setActiveIndex: (index: number) => void;
  navigateNext: () => void;
  navigatePrev: () => void;
  selectCurrent: () => SearchResultItem | null;
  clear: () => void;
  closeDropdown: () => void;
  reset: () => void;
};

let debounceTimeout: NodeJS.Timeout | null = null;

export const useSearchStore = create<SearchStore>()((set, get) => ({
  ...initialState,

  setQuery: (query: string) => {
    set({ query });

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (!query.trim()) {
      set({ results: [], isOpen: false, error: null });
      return;
    }

    debounceTimeout = setTimeout(() => {
      void get().search(query);
    }, DEBOUNCE_MS);
  },

  search: async (query: string) => {
    if (!query.trim()) {
      set({ results: [], isOpen: false });
      return;
    }

    set({ isLoading: true, error: null });

    const result = await fetchApi<SearchResponse>(
      `/api/search?q=${encodeURIComponent(query)}&limit=20`,
    );

    if (result.ok) {
      set({
        results: result.data.results,
        isOpen: true,
        activeIndex: -1,
        isLoading: false,
      });
    } else {
      set({
        error: 'Failed to search. Please try again.',
        results: [],
        isLoading: false,
      });
      console.error('Search failed:', result.error);
    }
  },

  setIsOpen: (isOpen: boolean) => {
    set({ isOpen, activeIndex: isOpen ? get().activeIndex : -1 });
  },

  setActiveIndex: (index: number) => {
    set({ activeIndex: index });
  },

  navigateNext: () => {
    const { results, activeIndex } = get();
    if (results.length === 0) return;
    set({
      activeIndex: activeIndex < results.length - 1 ? activeIndex + 1 : 0,
    });
  },

  navigatePrev: () => {
    const { results, activeIndex } = get();
    if (results.length === 0) return;
    set({
      activeIndex: activeIndex > 0 ? activeIndex - 1 : results.length - 1,
    });
  },

  selectCurrent: () => {
    const { results, activeIndex } = get();
    if (activeIndex >= 0 && activeIndex < results.length) {
      const selected = results[activeIndex];
      set({ isOpen: false, query: '' });
      return selected;
    }
    return null;
  },

  clear: () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    set({ ...initialState });
  },

  closeDropdown: () => {
    set({ isOpen: false, activeIndex: -1 });
  },

  reset: () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    set(initialState);
  },
}));
