import { HiX } from 'react-icons/hi';
import type { FilterMetadata } from './helpers';
import { cn } from '@/utils';

interface FilterHeaderProps {
  metadata: FilterMetadata;
  count: number;
  onClose: () => void;
}

export default function FilterHeader({
  metadata,
  count,
  onClose,
}: FilterHeaderProps) {
  const { type, Icon, name } = metadata;

  return (
    <div
      className={cn('sticky top-0 z-10 p-4 text-dark-secondary', {
        'bg-category-yellow': type === 'Category',
        'bg-location-pink': type === 'Location',
        'bg-tp-skyblue': type === 'Time Period',
      })}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-dark-secondary text-xs font-medium uppercase mb-1">
            <Icon className="w-3.5 h-3.5" />
            <span>{type}</span>
          </div>

          <h2 className="text-3xl font-black truncate">{name}</h2>

          <p className="text-sm text-dark-secondary mt-0.5">
            {count} {count === 1 ? 'mystery' : 'mysteries'} found
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-dark-secondary hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-dark-secondary transition-colors"
          aria-label="Close panel"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
