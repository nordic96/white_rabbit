'use client';

import { useFilterStore } from '@/store';
import { cn } from '@/utils';
import { useEffect } from 'react';
import FilterResultsSection from '../FilterResultsSection/FilterResultsSection';

export default function RightSidePanel() {
  const { filterId, unSelectFilter } = useFilterStore();

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
      role="complementary"
      aria-label="Filtered Mystery details panel"
      aria-hidden={filterId === null}
      className={cn(
        'absolute right-0 top-0 h-full transition-all duration-300 ease-out',
        'w-90 shadow-2xl shadow-black/20 dark:shadow-black/50',
        'border-l border-gray-200 dark:border-gray-700',
        'bg-gray-100 dark:bg-dark-gray',
        filterId === null
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100',
      )}
    >
      <FilterResultsSection />
    </div>
  );
}
