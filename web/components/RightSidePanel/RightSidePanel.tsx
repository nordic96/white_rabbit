'use client';

import useClickOutside from '@/hooks/useClickOutside';
import { useFilterStore } from '@/store';
import { cn } from '@/utils';
import { useEffect, useRef } from 'react';
import FilterResultsSection from '../FilterResultsSection/FilterResultsSection';

export default function RightSidePanel() {
  const ref = useRef<HTMLDivElement>(null);
  const { filterId, unSelectFilter } = useFilterStore();

  useClickOutside(ref, () => {
    unSelectFilter();
  });

  useEffect(() => {
    return () => unSelectFilter();
  }, [unSelectFilter]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && filterId) {
        unSelectFilter();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [filterId, unSelectFilter]);

  return (
    <div
      ref={ref}
      role={'complementary'}
      aria-label={'Filtered Mystery details panel'}
      aria-hidden={filterId === null}
      className={cn(
        'absolute right-0 top-[50%] -translate-y-[50%] transition-transform ease-in-out',
        { 'translate-x-200': filterId === null },
        { 'translate-x-0': filterId !== null },
        'w-120 h-full border border-black bg-white',
      )}
    >
      <FilterResultsSection />
    </div>
  );
}
