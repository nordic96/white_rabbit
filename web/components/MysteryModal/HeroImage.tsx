'use client';

import Image from 'next/image';
import { HiQuestionMarkCircle } from 'react-icons/hi';

interface HeroImageProps {
  imageUrl: string | null;
  altText: string;
}

export default function HeroImage({
  imageUrl,
  altText,
}: HeroImageProps): React.ReactElement {
  return (
    <div className="relative aspect-4/3 lg:aspect-3/4 bg-gray-100 dark:bg-gray-800 overflow-hidden">
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt={altText}
            fill
            className="object-cover"
            draggable={false}
            priority
          />
          {/* Gradient overlay at bottom for potential caption */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
        </>
      ) : (
        // Placeholder when no image is available
        <div className="flex items-center justify-center h-full">
          <HiQuestionMarkCircle
            className="w-24 h-24 text-gray-400 dark:text-gray-600"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
