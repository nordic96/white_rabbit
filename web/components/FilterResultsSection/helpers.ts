import {
  CATEGORY_ID_PREFIX,
  LOCATION_ID_PREFIX,
  TIMEPERIOD_ID_PREFIX,
} from '@/types';
import { HiLocationMarker, HiTag, HiClock } from 'react-icons/hi';
import type { IconType } from 'react-icons';

export interface FilterMetadata {
  type: 'Location' | 'Category' | 'Time Period';
  Icon: IconType;
  name: string;
}

function extractName(id: string, prefix: string): string {
  const rawName = id.replace(prefix, '').replace(/-/g, ' ');
  return rawName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getFilterMetadata(
  filterId: string | null,
): FilterMetadata | null {
  if (!filterId) return null;

  if (filterId.startsWith(LOCATION_ID_PREFIX)) {
    return {
      type: 'Location',
      Icon: HiLocationMarker,
      name: extractName(filterId, LOCATION_ID_PREFIX),
    };
  }

  if (filterId.startsWith(CATEGORY_ID_PREFIX)) {
    return {
      type: 'Category',
      Icon: HiTag,
      name: extractName(filterId, CATEGORY_ID_PREFIX),
    };
  }

  if (filterId.startsWith(TIMEPERIOD_ID_PREFIX)) {
    return {
      type: 'Time Period',
      Icon: HiClock,
      name: extractName(filterId, TIMEPERIOD_ID_PREFIX),
    };
  }

  return null;
}
