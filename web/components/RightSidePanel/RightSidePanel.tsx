/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import useClickOutside from '@/hooks/useClickOutside';
import { useMysteryStore } from '@/store/mysteryStore';
import { cn } from '@/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function RightSidePanel() {
  const ref = useRef<HTMLDivElement>(null);
  const selectedId = useMysteryStore((s) => s.selectedId);
  const unSelect = useMysteryStore((s) => s.unSelect);

  const [details, setDetails] = useState();

  useClickOutside(ref, (e) => {
    e.preventDefault();
    unSelect();
  });

  const fetchDetails = useCallback(async () => {
    if (selectedId === null) {
      return;
    }
    try {
      const res = await fetch(`/api/mysteries/${selectedId}`);
      if (res.ok) {
        const mysteryDetail = await res.json();
        setDetails(mysteryDetail);
        console.log('Mystery detail with similar mysteries:', mysteryDetail);
      }
    } catch (err) {
      console.error('Failed to fetch mystery:', err);
    }
  }, [selectedId, setDetails]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return (
    <div
      ref={ref}
      className={cn(
        'absolute top-[40%] -translate-y-[40%] right-0 transition-transform ease-in-out',
        { 'translate-x-200': selectedId === null },
        { 'translate-x-0': selectedId !== null },
        'w-180 h-220 border border-black bg-white',
      )}
    >
      {JSON.stringify(details)}
    </div>
  );
}
