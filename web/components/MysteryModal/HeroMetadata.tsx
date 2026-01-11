'use client';

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

const ICON_PATHS = {
  confidence: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  calendar:
    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  close: 'M6 18L18 6M6 6l12 12',
};

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
    <div className="relative flex flex-col justify-center bg-gray-50 dark:bg-gray-800/50 p-6 lg:p-8">
      {/* Close button in top right */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Close modal"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={ICON_PATHS.close}
          />
        </svg>
      </button>

      {/* Content */}
      <div className="space-y-4 pr-12">
        <h2
          id="mystery-modal-title"
          className="text-2xl lg:text-5xl font-extrabold text-gray-900 dark:text-gray-100"
        >
          {title}
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />

          {confidenceScore !== undefined && (
            <span className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400">
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={ICON_PATHS.confidence}
                />
              </svg>
              Confidence: {Math.round(confidenceScore * 100)}%
            </span>
          )}

          {dateRange && (
            <span className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400">
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={ICON_PATHS.calendar}
                />
              </svg>
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
