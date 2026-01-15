'use client';

import Image from 'next/image';
import { cn } from '@/utils/cn';

interface ThumbnailRowProps {
  images: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default function ThumbnailRow({
  images,
  activeIndex,
  onSelect,
}: ThumbnailRowProps): React.ReactElement | null {
  // Don't render if there's only one image (the hero)
  if (images.length <= 1) {
    return null;
  }

  return (
    <div className="flex gap-1 p-1 bg-dark-secondary overflow-x-auto">
      {images.map((url, index) => (
        <button
          key={url}
          type="button"
          onClick={() => onSelect(index)}
          className={cn(
            'relative shrink-0 w-14 h-14 rounded overflow-hidden border-2 transition-all',
            index === activeIndex
              ? 'border-mystery-purple ring-0.5 ring-mystery-purple scale-105'
              : 'border-transparent hover:border-gray-600',
          )}
          aria-label={`View image ${index + 1}`}
          aria-pressed={index === activeIndex}
        >
          <Image
            src={url}
            alt={`Thumbnail ${index + 1}`}
            fill
            draggable={false}
            className="object-cover"
            sizes="56px"
          />
        </button>
      ))}
    </div>
  );
}
