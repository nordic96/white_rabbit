import { LocationNode, TimePeriodNode, CategoryNode } from '@/types/mystery';
import { wrapAdBc } from '@/utils';

interface MetadataSectionProps {
  locations: LocationNode[];
  timePeriods: TimePeriodNode[];
  categories: CategoryNode[];
}

interface SectionHeaderProps {
  iconPaths: string[];
  title: string;
}

function SectionHeader({
  iconPaths,
  title,
}: SectionHeaderProps): React.ReactElement {
  return (
    <div className="flex items-center mb-3">
      <svg
        className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {iconPaths.map((d, i) => (
          <path
            key={i}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={d}
          />
        ))}
      </svg>
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {title}
      </h4>
    </div>
  );
}

const ICON_PATHS = {
  location: [
    'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
    'M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  ],
  time: ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  category: [
    'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  ],
};

const TAG_STYLES = {
  location:
    'bg-pink-50 border-pink-200 text-pink-800 dark:bg-pink-900/20 dark:border-pink-800/40 dark:text-pink-300',
  time: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/40 dark:text-yellow-300',
  category:
    'bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-900/20 dark:border-cyan-800/40 dark:text-cyan-300',
};

export default function MetadataSection({
  locations,
  timePeriods,
  categories,
}: MetadataSectionProps): React.ReactElement {
  return (
    <div className="space-y-6 flex gap-4">
      {locations.length > 0 && (
        <div>
          <SectionHeader iconPaths={ICON_PATHS.location} title="Locations" />
          <div className="flex flex-wrap gap-2">
            {locations.map((location) => (
              <span
                key={location.id}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm border ${TAG_STYLES.location}`}
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
          <SectionHeader iconPaths={ICON_PATHS.time} title="Time Periods" />
          <div className="flex flex-wrap gap-2">
            {timePeriods.map((period) => (
              <span
                key={period.id}
                className={`inline-flex flex-col items-center px-3 py-1.5 rounded-lg text-sm border ${TAG_STYLES.time}`}
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
          <SectionHeader iconPaths={ICON_PATHS.category} title="Categories" />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.id}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm border ${TAG_STYLES.category}`}
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
