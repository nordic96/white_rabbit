'use client';

import Image from 'next/image';

interface HeroImageProps {
  imageUrl: string | null;
  altText: string;
}

export default function HeroImage({
  imageUrl,
  altText,
}: HeroImageProps): React.ReactElement {
  return (
    <div className="relative aspect-[4/3] lg:aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden">
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
          <svg
            className="w-24 h-24 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
