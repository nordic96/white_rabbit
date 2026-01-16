import { HiCheck, HiX, HiExclamation } from 'react-icons/hi';
import { cn } from '@/utils/cn';
import type { IconType } from 'react-icons';

interface StatusBadgeProps {
  status: string;
}

type StatusType = 'solved' | 'unsolved' | 'disputed' | 'default';

const STATUS_CONFIG: Record<
  StatusType,
  { colorClasses: string; Icon: IconType | null }
> = {
  solved: {
    colorClasses: 'bg-green-900/40 text-green-300',
    Icon: HiCheck,
  },
  unsolved: {
    colorClasses: 'bg-red-900/40 text-red-300',
    Icon: HiX,
  },
  disputed: {
    colorClasses: 'bg-yellow-900/40 text-yellow-300',
    Icon: HiExclamation,
  },
  default: {
    colorClasses: 'bg-dark-gray/40 text-gray-300',
    Icon: null,
  },
};

function formatStatus(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getStatusType(normalizedStatus: string): StatusType {
  switch (normalizedStatus) {
    case 'solved':
      return 'solved';
    case 'unsolved':
      return 'unsolved';
    case 'disputed':
      return 'disputed';
    default:
      if (normalizedStatus.includes('partial')) {
        return 'disputed';
      }
      return 'default';
  }
}

export default function StatusBadge({
  status,
}: StatusBadgeProps): React.ReactElement {
  const normalizedStatus = status.toLowerCase();
  const statusType = getStatusType(normalizedStatus);
  const { colorClasses, Icon } = STATUS_CONFIG[statusType];

  return (
    <span
      className={cn(
        'inline-flex items-center p-1.5 max-sm:p-1 rounded-full text-xs font-medium',
        colorClasses,
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5 mr-1" />}
      {formatStatus(status)}
    </span>
  );
}
