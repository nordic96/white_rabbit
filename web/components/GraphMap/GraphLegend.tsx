'use client';

import {
  HiQuestionMarkCircle,
  HiLocationMarker,
  HiClock,
  HiTag,
} from 'react-icons/hi';
import type { IconType } from 'react-icons';

interface LegendItem {
  label: string;
  color: string;
  Icon: IconType;
}

const LEGEND_ITEMS: LegendItem[] = [
  { label: 'Mystery', color: '#4142f3', Icon: HiQuestionMarkCircle },
  { label: 'Location', color: '#ff79c6', Icon: HiLocationMarker },
  { label: 'Time Period', color: '#8be9fd', Icon: HiClock },
  { label: 'Category', color: '#fedf66', Icon: HiTag },
];

export default function GraphLegend() {
  return (
    <div className="bg-dark-gray/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Node Types
      </h3>
      <div className="flex flex-col gap-1.5">
        {LEGEND_ITEMS.map(({ label, color, Icon }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <Icon className="w-4 h-4 text-gray-400" aria-hidden="true" />
            <span className="text-sm text-gray-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
