'use client';

import { useMemo, useEffect, useRef } from 'react';
import {
  HiQuestionMarkCircle,
  HiLocationMarker,
  HiClock,
  HiTag,
} from 'react-icons/hi';
import { SearchResultItem } from '@/types';
import { cn } from '@/utils';
import LoadingSpinner from '../shared/LoadingSpinner';

interface SearchDropdownProps {
  results: SearchResultItem[];
  isLoading: boolean;
  error: string | null;
  activeIndex: number;
  onSelect: (result: SearchResultItem) => void;
  onHover: (index: number) => void;
}

interface CategoryConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Mystery: {
    label: 'Mysteries',
    icon: HiQuestionMarkCircle,
    color: 'text-purple-500',
  },
  Location: {
    label: 'Locations',
    icon: HiLocationMarker,
    color: 'text-green-500',
  },
  TimePeriod: {
    label: 'Time Periods',
    icon: HiClock,
    color: 'text-blue-500',
  },
  Category: {
    label: 'Categories',
    icon: HiTag,
    color: 'text-orange-500',
  },
};

export function SearchDropdown({
  results,
  isLoading,
  error,
  activeIndex,
  onSelect,
  onHover,
}: SearchDropdownProps) {
  const listboxRef = useRef<HTMLDivElement>(null);

  // Scroll active item into view when navigating with keyboard
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const activeElement = listboxRef.current.querySelector(
        `#search-result-${activeIndex}`,
      ) as HTMLElement | null;

      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [activeIndex]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResultItem[]> = {};

    results.forEach((result) => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });

    return groups;
  }, [results]);

  // Calculate flat index for keyboard navigation
  const getFlatIndex = (type: string, indexInGroup: number): number => {
    let flatIndex = 0;
    const typeOrder = ['Mystery', 'Location', 'TimePeriod', 'Category'];

    for (const t of typeOrder) {
      if (t === type) {
        return flatIndex + indexInGroup;
      }
      flatIndex += groupedResults[t]?.length || 0;
    }

    return flatIndex;
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'absolute z-50 w-full mt-1 p-4',
          'bg-dark-gray',
          'border border-gray-700',
          'rounded-lg shadow-lg',
          'text-center text-gray-400',
        )}
      >
        <LoadingSpinner message={'Searching'} size={'sm'} fullScreen={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'absolute z-50 w-full mt-1 p-4',
          'bg-dark-gray',
          'border border-red-800',
          'rounded-lg shadow-lg',
          'text-center text-red-400',
        )}
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div
        className={cn(
          'absolute z-50 w-full mt-1 p-4',
          'bg-dark-gray',
          'border border-gray-700',
          'rounded-lg shadow-lg',
          'text-center text-gray-400',
        )}
        role="status"
      >
        No results found
      </div>
    );
  }

  return (
    <div
      id="search-results-listbox"
      ref={listboxRef}
      className={cn(
        'absolute z-50 w-full mt-1',
        'bg-dark-gray',
        'border border-gray-700',
        'rounded-lg shadow-lg',
        'max-h-96 overflow-y-auto',
      )}
      role="listbox"
      aria-label="Search results"
    >
      {(['Mystery', 'Location', 'TimePeriod', 'Category'] as const).map(
        (type) => {
          const items = groupedResults[type];
          if (!items || items.length === 0) return null;

          const config = CATEGORY_CONFIG[type];
          const Icon = config.icon;

          return (
            <div key={type} className="py-2">
              {/* Category Header */}
              <div
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold uppercase tracking-wider',
                  'text-gray-400',
                  'flex items-center gap-2',
                )}
              >
                <Icon
                  className={cn('w-4 h-4', config.color)}
                  aria-hidden="true"
                />
                {config.label}
                <span className="text-gray-500">({items.length})</span>
              </div>

              {/* Category Items */}
              {items.map((result, indexInGroup) => {
                const flatIndex = getFlatIndex(type, indexInGroup);
                const isActive = flatIndex === activeIndex;

                return (
                  <div
                    key={result.id}
                    id={`search-result-${flatIndex}`}
                    role="option"
                    aria-selected={isActive}
                    className={cn(
                      'px-3 py-2 cursor-pointer',
                      'transition-colors',
                      isActive ? 'bg-blue-900/30' : 'hover:bg-gray-800',
                    )}
                    onClick={() => onSelect(result)}
                    onMouseEnter={() => onHover(flatIndex)}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-sm',
                          isActive ? 'text-blue-300' : 'text-gray-100',
                        )}
                      >
                        {result.text}
                      </span>
                      <span className="text-xs text-gray-500">
                        {result.score.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        },
      )}
    </div>
  );
}
