'use client';

import { useState } from 'react';
import { HiPlay, HiChevronDown } from 'react-icons/hi';
import { cn } from '@/utils/cn';

interface CollapsibleVideoSectionProps {
  videos: string[];
}

export default function CollapsibleVideoSection({
  videos,
}: CollapsibleVideoSectionProps): React.ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-secondary/50 hover:bg-gray-100 dark:hover:bg-dark-secondary transition-colors"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 font-medium text-dark-gray dark:text-gray-100">
          <HiPlay className="w-5 h-5 text-blue-500" aria-hidden="true" />
          Watch Analysis Videos ({videos.length})
        </span>
        <HiChevronDown
          className={cn(
            'w-5 h-5 text-gray-500 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {/* Expandable Content */}
      {isOpen && (
        <div className="animate-in slide-in-from-top-2 duration-200 p-4 space-y-4">
          {/* Video Player */}
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videos[activeIndex]}`}
              title={`Video ${activeIndex + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          {/* Video Tabs (if multiple videos) */}
          {videos.length > 1 && (
            <div className="flex gap-2">
              {videos.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    index === activeIndex
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                  )}
                  aria-pressed={index === activeIndex}
                >
                  Video {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
