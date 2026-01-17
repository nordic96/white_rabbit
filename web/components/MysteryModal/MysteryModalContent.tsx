'use client';

import { MysteryDetail } from '@/types/mystery';
import { useMysteryStore } from '@/store/mysteryStore';
import HeroSection from './HeroSection';
import CollapsibleVideoSection from './CollapsibleVideoSection';
import SimilarMysteryCard from './SimilarMysteryCard';
import { wrapAdBc } from '@/utils';

interface MysteryModalContentProps {
  mystery: MysteryDetail;
  onClose: () => void;
}

function getDateRangeText(
  firstYear: number | null | undefined,
  lastYear: number | null | undefined,
): string | null {
  if (!firstYear) return null;
  if (lastYear) {
    return `${wrapAdBc(firstYear)} - ${wrapAdBc(lastYear)}`;
  }
  return wrapAdBc(firstYear);
}

const MAX_SIMILAR_MYSTERIES_DISPLAY = 9;
export default function MysteryModalContent({
  mystery,
  onClose,
}: MysteryModalContentProps): React.ReactElement {
  const setSelectedId = useMysteryStore((state) => state.setSelectedId);

  const dateRangeText = getDateRangeText(
    mystery.first_reported_year,
    mystery.last_reported_year,
  );

  // All images for hero section thumbnails
  const allImages = mystery.image_source ?? [];
  const videos = mystery.video_source ?? [];
  const hasSimilarMysteries = mystery.similar_mysteries.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Hero Section - Fixed at top */}
      <HeroSection
        id={mystery.id}
        images={allImages}
        title={mystery.title}
        status={mystery.status}
        confidenceScore={mystery.confidence_score}
        dateRange={dateRangeText}
        locations={mystery.locations}
        timePeriods={mystery.time_periods}
        categories={mystery.categories}
        onClose={onClose}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
        {/* Collapsible Video Section */}
        <CollapsibleVideoSection videos={videos} />
        {hasSimilarMysteries && (
          <>
            <div className="border-t border-gray-700" />
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                Similar Mysteries
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {mystery.similar_mysteries
                  .sort((a, b) => b.score - a.score)
                  .slice(
                    0,
                    Math.min(
                      mystery.similar_mysteries.length,
                      MAX_SIMILAR_MYSTERIES_DISPLAY,
                    ),
                  )
                  .map((similar) => (
                    <SimilarMysteryCard
                      key={similar.id}
                      mystery={similar}
                      onClick={setSelectedId}
                    />
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
