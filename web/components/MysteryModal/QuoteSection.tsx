'use client';

import { useState } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';

interface QuoteSectionProps {
  quote?: string;
  attribution?: string;
}

export default function QuoteSection({
  quote,
  attribution,
}: QuoteSectionProps): React.ReactElement | null {
  const [isPlaying, setIsPlaying] = useState(false);

  // Don't render if no quote is provided
  if (!quote) {
    return null;
  }

  const handlePlayPause = () => {
    // TODO: Integrate with TTS API when available
    setIsPlaying(!isPlaying);

    // Placeholder for TTS functionality
    if (!isPlaying) {
      console.log('Starting TTS narration for:', quote);
      // Simulate playing for demo purposes
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    } else {
      console.log('Stopping TTS narration');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-800 via-slate-900 to-black p-6 shadow-lg">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255, 255, 255, 0.1) 10px,
              rgba(255, 255, 255, 0.1) 20px
            )`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Quote Text */}
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <blockquote className="text-gray-100 text-lg sm:text-xl italic font-serif leading-relaxed">
            "{quote}"
          </blockquote>
          {attribution && (
            <cite className="block mt-3 text-sm text-gray-400 not-italic font-sans">
              — {attribution}
            </cite>
          )}
        </div>

        {/* Play Button */}
        <button
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg text-gray-100 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap group"
        >
          {isPlaying ? (
            <>
              <FaPause className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Pause</span>
            </>
          ) : (
            <>
              <FaPlay className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Listen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
