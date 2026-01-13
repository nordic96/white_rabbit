import { TTSRequest, TTSResponse, TTSWarmupResponse } from '@/types';
import { fetchApi } from '@/utils';
import { create } from 'zustand';

interface QuoteState {
  loading: boolean;
  error: string | Error | null;
}

interface QuoteActions {
  setLoading: (loading: boolean) => void;
  initLoading: () => void;
  setError: (error: Error | string) => void;
  generateQuote: (mysteryId: string, text: string) => Promise<string>;
}

const initialState: QuoteState = {
  loading: false,
  error: null,
};

type QuoteStore = QuoteState & QuoteActions;

let currentController: AbortController | null = null;
export const useQuoteStore = create<QuoteStore>()((set, get) => ({
  ...initialState,
  setLoading: (loading: boolean) => set({ loading: loading }),
  initLoading: () => set({ loading: true, error: null }),
  setError: (error: string | Error) => set({ error: error }),
  generateQuote: async (mysteryId: string, text: string) => {
    if (currentController) {
      currentController.abort();
    }
    const controller = new AbortController();
    currentController = controller;
    const baseUrl = window.location.href;
    const apiWarmupUrl = new URL('/api/tts/warmup', baseUrl);

    get().initLoading();
    try {
      const warmupRes = await fetchApi<TTSWarmupResponse>(apiWarmupUrl, {
        method: 'GET', // or 'POST' if needed
        signal: controller.signal,
      });

      if (
        !warmupRes.ok ||
        !warmupRes.data ||
        warmupRes.data.status === 'not_loaded'
      ) {
        throw new Error('Model Warmup process failed. Model not loaded');
      }

      console.log(warmupRes.data.status);
      const audioUrl = await fetchAudioUrl(mysteryId, text);

      return audioUrl;
    } catch (e) {
      get().setError(e as Error);
      return ''; // or throw, depending on your needs
    } finally {
      get().setLoading(false);
    }
  },
}));

async function fetchAudioUrl(id: string, text: string) {
  const baseUrl = window.location.href;
  const apiUrl = new URL('/api/tts', baseUrl);

  const res = await fetchApi<TTSResponse>(apiUrl, {
    method: 'POST',
    body: JSON.stringify({
      mystery_id: id,
      text: text,
    } as TTSRequest),
  });

  if (!res.ok || !res.data) {
    throw new Error('TTS Generation API Failed');
  }
  return res.data.audio_url;
}
