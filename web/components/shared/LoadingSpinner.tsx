'use client';
import { cn } from '@/utils';
import { ClassValue } from 'clsx';
import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: ClassValue;
  fullScreen?: boolean;
}

const MAX_DOTS = 5;
const DOT_INTERVAL_MS = 600;

const SIZE_STYLES = {
  lg: {
    spinner: 'h-24 w-24 max-sm:h-16 max-sm:w-16 border-b-8 border-r-8',
    text: 'text-lg max-sm:text-sm',
  },
  md: {
    spinner: 'h-16 w-16 max-sm:h-12 max-sm:w-12 border-b-4 border-r-4',
    text: 'text-base max-sm:text-sm',
  },
  sm: {
    spinner: 'h-8 w-8 max-sm:h-4 max-sm:w-4 border-b-4 border-r-4',
    text: 'text-sm max-sm:text-xs',
  },
} as const;

/**
 * A reusable loading spinner component with animated dots and customisable sizing
 * @param size - Spinner size variant: 'sm' | 'md' | 'lg' (default: 'lg')
 * @param message - Loading message to display (default: 'Loading')
 * @param fullScreen - Whether to center in full screen height (default: true)
 * @param className - Additional CSS classes to apply
 */
export default function LoadingSpinner({
  message = 'Loading',
  size = 'lg',
  fullScreen = true,
  className,
}: LoadingSpinnerProps) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev + 1) % MAX_DOTS);
    }, DOT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        className,
        'w-full flex flex-col items-center justify-center text-white',
        { 'h-screen': fullScreen },
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'animate-spin rounded-full border-mystery-purple border-t-transparent mx-auto mb-4',
          SIZE_STYLES[size].spinner,
        )}
      />
      <p className={SIZE_STYLES[size].text}>
        {message}
        {'.'.repeat(dots)}
      </p>
    </div>
  );
}
