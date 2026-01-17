'use client';
import { cn } from '@/utils';
import { ClassValue } from 'clsx';
import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string | ClassValue;
  fullScreen?: boolean;
}

const MAX_DOTS = 5;
export default function LoadingSpinner({
  message = 'Loading',
  size = 'lg',
  fullScreen = true,
  className,
}: LoadingSpinnerProps) {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((dots) => (dots + 1) % MAX_DOTS);
    }, 600);

    return () => clearInterval(interval);
  }, []);
  return (
    <div
      aria-label={'Loading'}
      className={cn(
        className,
        'w-full flex flex-col items-center justify-center text-white',
        { 'h-screen': fullScreen },
      )}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-mystery-purple mx-auto mb-4',
          {
            'h-24 w-24 max-sm:h-16 max-sm:w-16 border-b-8 border-r-8 text-lg max-sm:text-sm':
              size === 'lg' || size === 'md',
            'h-8 w-8 max-sm:h-4 max-sm:w-4 border-b-4 border-r-4 text-sm max-sm:text-xs':
              size === 'sm',
          },
        )}
      />
      <span className={'text-lg max-sm:text-sm'}>
        {message}
        {Array.from({ length: dots }, () => 1).map(() => '.')}
      </span>
    </div>
  );
}
