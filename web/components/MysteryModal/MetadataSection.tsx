import { HiLocationMarker, HiClock, HiTag } from 'react-icons/hi';
import type { IconType } from 'react-icons';
import { LocationNode, TimePeriodNode, CategoryNode } from '@/types/mystery';
import { cn, wrapAdBc } from '@/utils';

interface MetadataSectionProps {
  locations: LocationNode[];
  timePeriods: TimePeriodNode[];
  categories: CategoryNode[];
}

interface SectionHeaderProps {
  Icon: IconType;
  title: string;
}

function SectionHeader({
  Icon,
  title,
}: SectionHeaderProps): React.ReactElement {
  return (
    <div className="flex items-center mb-3">
      <Icon className="w-4 h-4 mr-2 text-gray-400" />
      <h4 className="text-xs font-semibold text-gray-400 uppercase">{title}</h4>
    </div>
  );
}

const TAG_STYLES = {
  location: 'bg-location-pink text-dark-gray',
  time: 'bg-timeperiod-skyblue text-dark-gray',
  category: 'bg-category-yellow text-dark-gray',
};

export default function MetadataSection({
  locations,
  timePeriods,
  categories,
}: MetadataSectionProps): React.ReactElement {
  const baseLabelStyle =
    'inline-flex items-center px-2 py-1.5 max-sm:py-1 rounded-lg border';
  return (
    <div className="grid grid-cols-3 gap-4 text-sm max-sm:text-xs">
      {locations.length > 0 && (
        <div>
          <SectionHeader Icon={HiLocationMarker} title="Locations" />
          <div className="flex flex-wrap gap-2">
            {locations.map((location) => (
              <span
                key={location.id}
                className={cn(TAG_STYLES.location, baseLabelStyle)}
              >
                {location.name}
                {location.country && (
                  <span className="ml-1 text-xs opacity-75">
                    ({location.country})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {timePeriods.length > 0 && (
        <div>
          <SectionHeader Icon={HiClock} title="Time Periods" />
          <div className="flex flex-wrap gap-2">
            {timePeriods.map((period) => (
              <span
                key={period.id}
                className={cn(TAG_STYLES.time, baseLabelStyle)}
              >
                {period.label}
                {period.start_year && period.end_year && (
                  <span className="ml-1 text-xs opacity-75">
                    ({wrapAdBc(period.start_year)}-{wrapAdBc(period.end_year)})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div>
          <SectionHeader Icon={HiTag} title="Categories" />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.id}
                className={cn(TAG_STYLES.category, baseLabelStyle)}
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
