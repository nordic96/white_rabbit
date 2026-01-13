/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useMysteryStore, useQuoteStore } from '@/store';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useRef } from 'react';
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
  const [isReady, setIsReady] = useState(false);
  const { generateQuote, loading, resetQuoteState } = useQuoteStore();
  const { selectedId } = useMysteryStore();
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const quote = t(id);
  const attribution = attributeT(id);

  useEffect(() => {
    if (!selectedId && audio) {
      audio.pause();
      setAudio(null);
    }
  }, [audio, selectedId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      setIsPlaying(false);
      setIsReady(false);
      resetQuoteState();
    };
  }, [resetQuoteState]);

  useEffect(() => {
    if (!audio || !audio.src || loading) return;

    setIsPlaying(true);
    audio.play();
  }, [audio, loading]);

  useEffect(() => {
    if (!id || !quote) return;

    setIsReady(false);
    setAudio(null);

    generateQuote(id, quote).then((url) => {
      if (!mountedRef.current || !url) return;

      const newAudio = new Audio(url);
      audioRef.current = newAudio;

      const handleCanPlay = () => {
        if (mountedRef.current) {
          setAudio(newAudio);
          setIsReady(true);
        }
      };

      const handleEnded = () => {
        if (mountedRef.current) {
          setIsPlaying(false);
        }
      };

      newAudio.addEventListener('canplaythrough', handleCanPlay);
      newAudio.addEventListener('ended', handleEnded);
    });
  }, [id, quote, generateQuote]);

  // Don't render if no quote is provided
  if (!quote) {
    return null;
  }

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
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
        {isReady && !loading && (
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
