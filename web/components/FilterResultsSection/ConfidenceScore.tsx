import { HiStar } from 'react-icons/hi';
import { cn } from '@/utils';

interface ConfidenceScoreProps {
  score: number;
}

export default function ConfidenceScore({ score }: ConfidenceScoreProps) {
  const filledStars = Math.round(score * 5);

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <HiStar
            key={i}
            className={cn(
              'w-3 h-3',
              i < filledStars
                ? 'text-yellow-500 dark:text-yellow-400'
                : 'text-gray-300 dark:text-gray-600',
            )}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-500 ml-0.5">
        {score.toFixed(2)}
      </span>
    </div>
  );
}
