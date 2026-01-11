'use client';

import { HiX, HiCheckCircle, HiCalendar } from 'react-icons/hi';
import { CategoryNode, LocationNode, TimePeriodNode } from '@/types';
import StatusBadge from './StatusBadge';
import MetadataSection from './MetadataSection';

interface HeroMetadataProps {
  title: string;
  status: string;
  confidenceScore?: number;
  locations: LocationNode[];
  timePeriods: TimePeriodNode[];
  categories: CategoryNode[];
  dateRange: string | null;
  onClose: () => void;
}

export default function HeroMetadata({
  title,
  status,
  confidenceScore,
  dateRange,
  timePeriods,
  categories,
  locations,
  onClose,
}: HeroMetadataProps): React.ReactElement {
  return (
    <div className="relative flex flex-col justify-center bg-gray-50 dark:bg-dark-secondary/50 p-6 lg:p-8">
      {/* Close button in top right */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Close modal"
      >
        <HiX className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="space-y-4 pr-12">
        <h2
          id="mystery-modal-title"
          className="text-2xl lg:text-5xl font-extrabold text-dark-gray dark:text-gray-100"
        >
          {title}
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />

          {confidenceScore !== undefined && (
            <span className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400">
              <HiCheckCircle className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Confidence: {Math.round(confidenceScore * 100)}%
            </span>
          )}

          {dateRange && (
            <span className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400">
              <HiCalendar className="w-4 h-4 mr-1.5" aria-hidden="true" />
              {dateRange}
            </span>
          )}
        </div>
        <MetadataSection
          locations={locations}
          timePeriods={timePeriods}
          categories={categories}
        />
      </div>
    </div>
  );
}
