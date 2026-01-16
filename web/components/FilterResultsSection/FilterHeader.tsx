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
      className={cn('sticky top-0 z-40 p-4', {
        'bg-category-yellow text-dark-gray': type === 'Category',
        'bg-location-pink text-white': type === 'Location',
        'bg-time-period-skyblue text-dark-gray': type === 'Time Period',
      })}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase mb-1 opacity-80">
            <Icon className="w-3.5 h-3.5" />
            <span>{type}</span>
          </div>

          <h2 className="text-3xl font-black truncate">{name}</h2>

          <p className="text-sm mt-0.5 opacity-80">
            {count} {count === 1 ? 'mystery' : 'mysteries'} found
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
          aria-label="Close panel"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
