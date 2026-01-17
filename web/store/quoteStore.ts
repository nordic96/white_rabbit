import { TTSRequest, TTSResponse, TTSWarmupResponse } from '@/types';
import { fetchApi } from '@/utils';
import { create } from 'zustand';

interface QuoteState {
  loading: boolean;
  error: Error | null;
}

interface QuoteActions {
  setLoading: (loading: boolean) => void;
  setError: (error: Error) => void;
  resetQuoteState: () => void;
  generateQuote: (mysteryId: string, text: string) => Promise<string>;
}

const initialState: QuoteState = {
  loading: false,
  error: null,
};

type QuoteStore = QuoteState & QuoteActions;

let currentController: AbortController | null = null;

export const useQuoteStore = create<QuoteStore>()((set) => ({
  ...initialState,
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  resetQuoteState: () => set(initialState),
  generateQuote: async (mysteryId, text) => {
    if (currentController) {
      currentController.abort();
    }

    const controller = new AbortController();
    currentController = controller;

    set({ loading: true, error: null });

    try {
      const baseUrl = window.location.origin;
      const warmupRes = await fetchApi<TTSWarmupResponse>(
        new URL('/api/tts/warmup', baseUrl),
        { method: 'GET', signal: controller.signal },
      );

      // Allow both 'disabled' (pre-generated audio) and 'warmed_up' (live TTS) statuses
      if (
        !warmupRes.ok ||
        (warmupRes.data.status !== 'disabled' &&
          warmupRes.data.status !== 'warmed_up')
      ) {
        throw new Error('Model warmup failed. Model not loaded');
      }

      const audioUrl = await fetchAudioUrl(mysteryId, text);
      return audioUrl;
    } catch (e) {
      set({ error: e instanceof Error ? e : new Error('Unknown error') });
      return '';
    } finally {
      set({ loading: false });
    }
  },
}));

async function fetchAudioUrl(id: string, text: string): Promise<string> {
  const baseUrl = window.location.origin;
  const res = await fetchApi<TTSResponse>(new URL('/api/tts', baseUrl), {
    method: 'POST',
    body: JSON.stringify({ mystery_id: id, text } as TTSRequest),
  });

  if (!res.ok) {
    throw new Error('TTS Generation API failed');
  }
  return res.data.audio_url;
}
