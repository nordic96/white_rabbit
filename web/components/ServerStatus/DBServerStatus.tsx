'use client';

import { DBHealthResponse, DBStatus } from '@/types';
import { ApiError, cn, fetchApi } from '@/utils';
import { useEffect, useRef, useState } from 'react';

const INTERVAL = 10000;

export default function DBServerStatus() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dbStatus, setDbStatus] = useState<DBStatus>('unknown');
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealth() {
      const baseUrl = window.location.href;
      const url = new URL('/api/health', baseUrl);
      try {
        const res = await fetchApi<DBHealthResponse>(url);
        if (res.ok) {
          setDbStatus(res.data.database.status);
          setDbError(null);
        } else {
          throw res.error;
        }
      } catch (e) {
        if (e instanceof Error || e instanceof ApiError) {
          setDbError(e.message);
          setDbStatus('unknown');
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
        <span>Database Server Status:</span>
        <div
          className={cn('w-3 h-3 rounded-full shadow-lg', {
            'bg-green-400': dbStatus === 'healthy',
            'bg-yellow-400': dbStatus === 'unknown',
            'bg-red-400': dbStatus === 'unhealthy',
          })}
        />
      </div>
      {dbError && <span>{dbError}</span>}
    </div>
  );
}
