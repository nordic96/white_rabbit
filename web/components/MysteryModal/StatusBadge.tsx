import { cn } from '@/utils/cn';

interface StatusBadgeProps {
  status: string;
}

type StatusType = 'solved' | 'unsolved' | 'disputed' | 'default';

const STATUS_CONFIG: Record<
  StatusType,
  { colorClasses: string; iconPath: string | null }
> = {
  solved: {
    colorClasses:
      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    iconPath:
      'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z',
  },
  unsolved: {
    colorClasses:
      'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    iconPath:
      'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z',
  },
  disputed: {
    colorClasses:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    iconPath:
      'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
  },
  default: {
    colorClasses:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
    iconPath: null,
  },
};

function formatStatus(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getStatusType(normalizedStatus: string): StatusType {
  if (normalizedStatus === 'solved') return 'solved';
  if (normalizedStatus === 'unsolved') return 'unsolved';
  if (normalizedStatus === 'disputed' || normalizedStatus.includes('partial'))
    return 'disputed';
  return 'default';
}

export default function StatusBadge({
  status,
}: StatusBadgeProps): React.ReactElement {
  const normalizedStatus = status.toLowerCase();
  const statusType = getStatusType(normalizedStatus);
  const { colorClasses, iconPath } = STATUS_CONFIG[statusType];

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium',
        colorClasses,
      )}
    >
      {iconPath && (
        <svg
          className="w-3.5 h-3.5 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d={iconPath} clipRule="evenodd" />
        </svg>
      )}
      {formatStatus(status)}
    </span>
  );
}
