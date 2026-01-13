/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useQuoteStore } from '@/store';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';

interface QuoteSectionProps {
  id: string;
}

export default function QuoteSection({
  id,
}: QuoteSectionProps): React.ReactElement | null {
  const t = useTranslations('Quotes');
  const attributeT = useTranslations('Quotes-Attributes');

  const [isPlaying, setIsPlaying] = useState(false);
  const { generateQuote, loading, error } = useQuoteStore();
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const quote = t(id);
  const attribution = attributeT(id);

  useEffect(() => {
    if (!audio) return;

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPlaying(true);
    audio.play();

    return () => {
      audio.removeEventListener('ended', () => setIsPlaying(false));
      setIsPlaying(false);
    };
  }, [audio]);

  useEffect(() => {
    generateQuote(id, quote).then((url) => {
      const audio = new Audio(url);
      setAudio(audio);
    });
  }, [generateQuote, id, quote]);

  // Don't render if no quote is provided
  if (!quote) {
    return null;
  }

  const handlePlayPause = () => {
    if (!audio) return;
    if (!isPlaying) {
      console.log('Starting TTS narration for:', quote);
      audio.play();
    } else {
      console.log('Stopping TTS narration');
      audio.pause();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-dark-blue via-dark-blue to-light-blue via-80% p-3 shadow-lg">
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
          <blockquote className="text-gray-100 text-base sm:text-base italic font-serif leading-relaxed">
            {`"${quote}"`}
          </blockquote>
          {attribution && (
            <cite className="block mt-3 text-sm text-gray-400 not-italic font-sans">
              — {attribution}
            </cite>
          )}
        </div>

        {/* Play Button */}
        {audio && (
          <button
            onClick={handlePlayPause}
            aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
            className="flex items-center gap-2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg text-gray-100 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap group"
          >
            {isPlaying ? (
              <FaPause className="w-3 h-3 group-hover:scale-110 transition-transform" />
            ) : (
              <FaPlay className="w-3 h-3 group-hover:scale-110 transition-transform" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
