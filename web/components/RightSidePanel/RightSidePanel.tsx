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
        'w-90 max-sm:w-full shadow-2xl shadow-black/50 z-49',
        filterId === null
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100',
      )}
    >
      <div className={'absolute bg-dark-gray opacity-70 inset-0 z-49'}></div>
      <div className={'z-50 absolute inset-0'}>
        <FilterResultsSection />
      </div>
    </div>
  );
}
