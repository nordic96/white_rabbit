import { SearchResponse, SearchResultItem } from '@/types';
import { fetchApi } from '@/utils';
import { create } from 'zustand';
import { useMysteryStore } from './mysteryStore';
import { useFilterStore } from './filterStore';

const DEBOUNCE_MS = 300;
const DEFAULT_RESULT_LIMIT = 20;
const TYPE_ORDER = ['Mystery', 'Location', 'TimePeriod', 'Category'];

/**
 * Sort results by type to match display order in SearchDropdown.
 * This ensures activeIndex refers to the same item in both store and display.
 */
function sortResultsByTypeOrder(
  results: SearchResultItem[],
): SearchResultItem[] {
  return [...results].sort((a, b) => {
    const aOrder = TYPE_ORDER.indexOf(a.type);
    const bOrder = TYPE_ORDER.indexOf(b.type);
    return aOrder - bOrder;
  });
}

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
  selectSearchResult: (res: SearchResultItem) => void;
};

let debounceTimeout: NodeJS.Timeout | null = null;
let abortController: AbortController | null = null;

export const useSearchStore = create<SearchStore>()((set, get) => ({
  ...initialState,
  selectSearchResult: (res: SearchResultItem) => {
    const { id, type } = res;
    const setFilter = useFilterStore.getState().setFilter;
    switch (type) {
      case 'Mystery': {
        useMysteryStore.getState().setSelectedId(id);
        break;
      }
      case 'Category': {
        setFilter(id);
        break;
      }
      case 'Location': {
        setFilter(id);
        break;
      }
      case 'TimePeriod': {
        setFilter(id);
        break;
      }
      default: {
        return;
      }
    }
  },
  setQuery: (query: string) => {
    set({ query });

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (!query.trim()) {
      // Cancel any in-flight request when query is cleared
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      set({ results: [], isOpen: false, error: null, isLoading: false });
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

    // Cancel previous in-flight request to prevent race conditions
    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();
    const currentController = abortController;

    set({ isLoading: true, error: null });

    try {
      const result = await fetchApi<SearchResponse>(
        `/api/search?q=${encodeURIComponent(query)}&limit=${DEFAULT_RESULT_LIMIT}`,
        { signal: currentController.signal },
      );

      // Check if this request was aborted (a newer request superseded it)
      if (currentController.signal.aborted) {
        return;
      }

      if (result.ok) {
        set({
          results: sortResultsByTypeOrder(result.data.results),
          isOpen: true,
          activeIndex: -1,
          isLoading: false,
        });
      } else {
        set({
          error: result.error.message || 'Failed to search. Please try again.',
          results: [],
          isLoading: false,
        });
      }
    } catch (error) {
      // Ignore abort errors - they're expected when cancelling requests
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      set({
        error: 'Failed to search. Please try again.',
        results: [],
        isLoading: false,
      });
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
    if (abortController) {
      abortController.abort();
      abortController = null;
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
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    set(initialState);
  },
}));
