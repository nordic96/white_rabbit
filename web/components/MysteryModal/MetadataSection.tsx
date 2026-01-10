'use client';

import { LocationNode, TimePeriodNode, CategoryNode } from '@/types/mystery';
import { wrapAdBc } from '@/utils';

interface MetadataSectionProps {
  locations: LocationNode[];
  timePeriods: TimePeriodNode[];
  categories: CategoryNode[];
}

export default function MetadataSection({
  locations,
  timePeriods,
  categories,
}: MetadataSectionProps) {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        Details
      </h3>

      {/* Locations */}
      {locations.length > 0 && (
        <div>
          <div className="flex items-center mb-3">
            <svg
              className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Locations
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {locations.map((location) => (
              <span
                key={location.id}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm border bg-pink-50 border-pink-200 text-pink-800 dark:bg-pink-900/20 dark:border-pink-800/40 dark:text-pink-300"
              >
                {location.name}
                {location.country && (
                  <span className="ml-1 text-xs opacity-75">
                    ({location.country})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Time Periods */}
      {timePeriods.length > 0 && (
        <div>
          <div className="flex items-center mb-3">
            <svg
              className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Time Periods
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {timePeriods.map((period) => (
              <span
                key={period.id}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm border bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/40 dark:text-yellow-300"
              >
                {period.label}
                {period.start_year && period.end_year && (
                  <span className="ml-1 text-xs opacity-75">
                    ({wrapAdBc(period.start_year)}-{wrapAdBc(period.end_year)})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <div className="flex items-center mb-3">
            <svg
              className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Categories
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm border bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-900/20 dark:border-cyan-800/40 dark:text-cyan-300"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
