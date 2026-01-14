'use client';

import { TTSHealthResponse, TTSModelStatus } from '@/types';
import { ApiError, cn, fetchApi } from '@/utils';
import { useEffect, useRef, useState } from 'react';

const INTERVAL = 60000;
export default function TTSServerStatus() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ttsStatus, setTtsStatus] = useState<TTSModelStatus>('not_loaded');
  const [ttsError, setTtsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealth() {
      const baseUrl = window.location.href;
      const url = new URL('/api/tts/health', baseUrl);
      try {
        const res = await fetchApi<TTSHealthResponse>(url);
        if (res.ok) {
          setTtsStatus(res.data.status);
          setTtsError(null);
        } else {
          throw res.error;
        }
      } catch (e) {
        if (e instanceof Error || e instanceof ApiError) {
          setTtsError(e.message);
          setTtsStatus('not_loaded');
        }
      }
    }
    fetchHealth();

    intervalRef.current = setInterval(async () => {
      await fetchHealth();
    }, INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div>
      <div
        className={
          'flex items-center gap-1 bg-dark-secondary rounded-lg px-1 py-0.5 text-white text-sm justify-between'
        }
      >
        <span>TTS Audio Server Status:</span>
        <div
          className={cn('w-3 h-3 rounded-full shadow-lg', {
            'bg-green-400': ttsStatus === 'ready',
            'bg-yellow-400': ttsStatus === 'warmed_up',
            'bg-red-400': ttsStatus === 'not_loaded',
          })}
        />
      </div>
      {ttsError && <span>{ttsError}</span>}
    </div>
  );
}
