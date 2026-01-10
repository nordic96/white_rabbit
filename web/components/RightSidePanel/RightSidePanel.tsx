'use client';

import useClickOutside from '@/hooks/useClickOutside';
import { useMysteryStore } from '@/store/mysteryStore';
import { cn } from '@/utils';
import { useEffect, useRef } from 'react';

export default function RightSidePanel() {
  const ref = useRef<HTMLDivElement>(null);

  const selectedId = useMysteryStore((s) => s.selectedId);
  const selectedDetail = useMysteryStore((s) =>
    s.selectedId ? s.cache[s.selectedId] : null,
  );
  const isLoading = useMysteryStore((s) => s.isLoading);
  const error = useMysteryStore((s) => s.error);
  const unSelect = useMysteryStore((s) => s.unSelect);

  useClickOutside(ref, () => {
    unSelect();
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedId) {
        unSelect();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedId, unSelect]);

  return (
    <div
      ref={ref}
      role={'complementary'}
      aria-label={'Mystery details panel'}
      aria-hidden={selectedId === null}
      className={cn(
        'absolute  right-[50%] translate-x-[50%] transition-transform ease-in-out',
        { 'translate-y-200': selectedId === null },
        { 'top-[70%] -translate-y-[70%]': selectedId !== null },
        'w-180 h-200 border border-black bg-white',
      )}
    >
      {isLoading && <div className="p-4">Loading...</div>}
      {error && <div className="p-4 text-red-500">{error}</div>}
      {selectedDetail && (
        <div className="p-4">{JSON.stringify(selectedDetail)}</div>
      )}
    </div>
  );
}
