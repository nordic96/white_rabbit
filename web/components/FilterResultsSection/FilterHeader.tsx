import { HiX } from 'react-icons/hi';
import type { FilterMetadata } from './helpers';

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
    <div className="sticky top-0 z-10 bg-gray-50 dark:bg-dark-gray border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
            <Icon className="w-3.5 h-3.5" />
            <span>{type}</span>
          </div>

          <h2 className="text-lg font-semibold text-dark-gray dark:text-gray-100 truncate">
            {name}
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
            {count} {count === 1 ? 'mystery' : 'mysteries'} found
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-dark-secondary transition-colors"
          aria-label="Close panel"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
