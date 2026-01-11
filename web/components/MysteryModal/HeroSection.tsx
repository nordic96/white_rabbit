'use client';

import { useState } from 'react';
import HeroImage from './HeroImage';
import HeroMetadata from './HeroMetadata';
import ThumbnailRow from './ThumbnailRow';
import { CategoryNode, LocationNode, TimePeriodNode } from '@/types';

interface HeroSectionProps {
  images: string[];
  title: string;
  status: string;
  confidenceScore?: number;
  dateRange: string | null;
  locations: LocationNode[];
  timePeriods: TimePeriodNode[];
  categories: CategoryNode[];
  onClose: () => void;
}

export default function HeroSection({
  images,
  title,
  status,
  confidenceScore,
  dateRange,
  onClose,
  locations,
  timePeriods,
  categories,
}: HeroSectionProps): React.ReactElement {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
      {/* Left column: Hero Image + Thumbnails (vertical stack) */}
      <div className="flex flex-col">
        <HeroImage imageUrl={activeImage} altText={title} />
        <ThumbnailRow
          images={images}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        />
      </div>

      {/* Right column: Metadata */}
      <HeroMetadata
        title={title}
        status={status}
        confidenceScore={confidenceScore}
        dateRange={dateRange}
        locations={locations}
        timePeriods={timePeriods}
        categories={categories}
        onClose={onClose}
      />
    </div>
  );
}
