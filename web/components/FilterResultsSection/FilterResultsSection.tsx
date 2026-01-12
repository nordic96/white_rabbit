'use client';

import { useFilterStore } from '@/store';
import { useMysteryStore } from '@/store/mysteryStore';
import {
  MysteryItem,
  CATEGORY_ID_PREFIX,
  LOCATION_ID_PREFIX,
  TIMEPERIOD_ID_PREFIX,
} from '@/types';
import { cn, wrapAdBc } from '@/utils';
import Image from 'next/image';
import {
  HiLocationMarker,
  HiTag,
  HiClock,
  HiX,
  HiSearch,
  HiExclamationCircle,
  HiQuestionMarkCircle,
  HiStar,
} from 'react-icons/hi';
import type { IconType } from 'react-icons';

// =============================================================================
// Helper Functions
// =============================================================================

interface FilterMetadata {
  type: 'Location' | 'Category' | 'Time Period';
  Icon: IconType;
  name: string;
}

function getFilterMetadata(filterId: string | null): FilterMetadata | null {
  if (!filterId) return null;

  // Extract name from filterId (e.g., "l-egypt" → "Egypt")
  const extractName = (id: string, prefix: string) => {
    const rawName = id.replace(prefix, '').replace(/-/g, ' ');
    return rawName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (filterId.startsWith(LOCATION_ID_PREFIX)) {
    return {
      type: 'Location',
      Icon: HiLocationMarker,
      name: extractName(filterId, LOCATION_ID_PREFIX),
    };
  }

  if (filterId.startsWith(CATEGORY_ID_PREFIX)) {
    return {
      type: 'Category',
      Icon: HiTag,
      name: extractName(filterId, CATEGORY_ID_PREFIX),
    };
  }

  if (filterId.startsWith(TIMEPERIOD_ID_PREFIX)) {
    return {
      type: 'Time Period',
      Icon: HiClock,
      name: extractName(filterId, TIMEPERIOD_ID_PREFIX),
    };
  }

  return null;
}

// =============================================================================
// FilterHeader Component
// =============================================================================

interface FilterHeaderProps {
  metadata: FilterMetadata;
  count: number;
  onClose: () => void;
}

function FilterHeader({ metadata, count, onClose }: FilterHeaderProps) {
  const { type, Icon, name } = metadata;

  return (
    <div className="sticky top-0 z-10 bg-gray-50 dark:bg-dark-gray border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Type label with icon */}
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
            <Icon className="w-3.5 h-3.5" />
            <span>{type}</span>
          </div>

          {/* Filter name */}
          <h2 className="text-lg font-semibold text-dark-gray dark:text-gray-100 truncate">
            {name}
          </h2>

          {/* Result count */}
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
            {count} {count === 1 ? 'mystery' : 'mysteries'} found
          </p>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-dark-secondary transition-colors"
          aria-label="Close panel"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// ConfidenceScore Component
// =============================================================================

interface ConfidenceScoreProps {
  score: number;
}

function ConfidenceScore({ score }: ConfidenceScoreProps) {
  const filledStars = Math.round(score * 5);

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <HiStar
            key={i}
            className={cn(
              'w-3 h-3',
              i < filledStars
                ? 'text-yellow-500 dark:text-yellow-400'
                : 'text-gray-300 dark:text-gray-600',
            )}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-500 ml-0.5">
        {score.toFixed(2)}
      </span>
    </div>
  );
}

// =============================================================================
// MysteryCard Component
// =============================================================================

interface MysteryCardProps {
  item: MysteryItem;
}

function MysteryCard({ item }: MysteryCardProps) {
  const { id, title, image_source, first_reported_year, confidence_score } =
    item;
  const setSelectedId = useMysteryStore((state) => state.setSelectedId);

  const hasImage = image_source && image_source.length > 0;

  const handleClick = () => {
    setSelectedId(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200',
        'bg-white dark:bg-dark-secondary',
        'border border-gray-200 dark:border-transparent',
        'hover:border-blue-400 dark:hover:border-gray-600',
        'hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-black/20',
        'hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-gray',
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-dark-gray">
        {hasImage ? (
          <Image
            src={image_source[0]}
            alt={`${title} thumbnail`}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HiQuestionMarkCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Title */}
        <h3 className="font-medium text-dark-gray dark:text-gray-100 line-clamp-2 leading-tight">
          {title}
        </h3>

        {/* Year */}
        {first_reported_year && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ~{wrapAdBc(first_reported_year)}
          </p>
        )}

        {/* Confidence Score */}
        {confidence_score !== undefined && (
          <div className="mt-1.5">
            <ConfidenceScore score={confidence_score} />
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton Loader
// =============================================================================

function SkeletonCard() {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-white dark:bg-dark-secondary animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="w-20 h-20 shrink-0 rounded-md bg-gray-200 dark:bg-dark-gray" />

      {/* Content skeleton */}
      <div className="flex-1 flex flex-col justify-center gap-2">
        <div className="h-4 bg-gray-200 dark:bg-dark-gray rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-dark-gray rounded w-1/3" />
        <div className="h-3 bg-gray-200 dark:bg-dark-gray rounded w-1/2" />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-4 space-y-3">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
      <HiSearch className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-medium text-dark-gray dark:text-gray-300 mb-2">
        No mysteries found
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-500">
        No mysteries match this filter. Try selecting a different node.
      </p>
    </div>
  );
}

// =============================================================================
// Error State
// =============================================================================

interface ErrorStateProps {
  error: Error | string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  const errorMessage =
    typeof error === 'string' ? error : error.message || 'An error occurred';

  return (
    <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
      <HiExclamationCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-dark-gray dark:text-gray-300 mb-2">
        Error loading mysteries
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
        {errorMessage}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function FilterResultsSection() {
  const {
    filterId,
    filteredMysteries,
    loading,
    error,
    setFilter,
    unSelectFilter,
  } = useFilterStore();

  const metadata = getFilterMetadata(filterId);

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-gray-100 dark:bg-dark-gray">
        {metadata && (
          <FilterHeader
            metadata={metadata}
            count={0}
            onClose={unSelectFilter}
          />
        )}
        <LoadingState />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col bg-gray-100 dark:bg-dark-gray">
        {metadata && (
          <FilterHeader
            metadata={metadata}
            count={0}
            onClose={unSelectFilter}
          />
        )}
        <ErrorState
          error={error}
          onRetry={() => filterId && setFilter(filterId)}
        />
      </div>
    );
  }

  // Empty state (after loading, no results)
  if (!loading && filteredMysteries.length === 0) {
    return (
      <div className="h-full flex flex-col bg-gray-100 dark:bg-dark-gray">
        {metadata && (
          <FilterHeader
            metadata={metadata}
            count={0}
            onClose={unSelectFilter}
          />
        )}
        <EmptyState />
      </div>
    );
  }

  // Results
  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-dark-gray">
      {metadata && (
        <FilterHeader
          metadata={metadata}
          count={filteredMysteries.length}
          onClose={unSelectFilter}
        />
      )}

      {/* Scrollable results */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
        {filteredMysteries.map((item) => (
          <MysteryCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
