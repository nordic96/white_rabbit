'use client';

import Image from 'next/image';
import { MysteryDetail } from '@/types/mystery';
import { useMysteryStore } from '@/store/mysteryStore';
import StatusBadge from './StatusBadge';
import MetadataSection from './MetadataSection';
import SimilarMysteryCard from './SimilarMysteryCard';
import { wrapAdBc } from '@/utils';

interface MysteryModalContentProps {
  mystery: MysteryDetail;
  onClose: () => void;
}

export default function MysteryModalContent({
  mystery,
  onClose,
}: MysteryModalContentProps) {
  const setSelectedId = useMysteryStore((state) => state.setSelectedId);

  const handleSimilarMysteryClick = (id: string) => {
    setSelectedId(id);
  };

  const dateRangeText =
    mystery.first_reported_year && mystery.last_reported_year
      ? `${wrapAdBc(mystery.first_reported_year)} - ${wrapAdBc(mystery.last_reported_year)}`
      : mystery.first_reported_year
        ? `${wrapAdBc(mystery.first_reported_year)}`
        : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {mystery.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={mystery.status} />
              {mystery.confidence_score !== undefined && (
                <span className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Confidence: {Math.round(mystery.confidence_score * 100)}%
                </span>
              )}
              {dateRangeText && (
                <span className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {dateRangeText}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            {/* Expand button - placeholder for future */}
            <button
              type="button"
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Expand to full page"
              title="Expand (coming soon)"
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
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Media Sources (Optional) */}
        {(mystery.image_source?.length || mystery.video_source?.length) && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Media Sources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mystery.image_source?.map((url, index) => (
                  <a
                    key={`img-${index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    <div className="aspect-4/3 relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <Image
                        alt="Mystery source image"
                        src={url}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        draggable={false}
                      />
                    </div>
                  </a>
                ))}
                {mystery.video_source?.map((url, index) => (
                  <div
                    key={`video-${index}`}
                    className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="aspect-video">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${url}`}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Section Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />
          </>
        )}

        {/* Metadata Section */}
        <MetadataSection
          locations={mystery.locations}
          timePeriods={mystery.time_periods}
          categories={mystery.categories}
        />

        {/* Section Divider */}
        {mystery.similar_mysteries.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700" />
        )}

        {/* Similar Mysteries */}
        {mystery.similar_mysteries.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Similar Mysteries
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mystery.similar_mysteries.map((similar) => (
                <SimilarMysteryCard
                  key={similar.id}
                  mystery={similar}
                  onClick={handleSimilarMysteryClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
