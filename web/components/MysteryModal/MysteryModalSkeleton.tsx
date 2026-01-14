export default function MysteryModalSkeleton() {
  return (
    <div className="flex flex-col h-full min-h-0 animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Left Column - Image + Thumbnails */}
        <div className="flex flex-col">
          {/* Hero Image Skeleton */}
          <div className="relative bg-gray-300 dark:bg-dark-gray">
            <div className="aspect-4/3 lg:aspect-3/4" />
          </div>

          {/* Thumbnail Row Skeleton */}
          <div className="bg-dark-gray px-4 py-3">
            <div className="flex justify-center gap-2 overflow-x-auto">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-14 h-14 shrink-0 rounded bg-gray-600"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Metadata Skeleton */}
        <div className="relative bg-gray-50 dark:bg-dark-secondary/50 p-6 lg:p-8 space-y-6 overflow-y-auto max-h-[60vh] lg:max-h-none">
          {/* Close Button Skeleton */}
          <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-gray" />
          </div>

          {/* Title Skeleton */}
          <div className="pr-12">
            <div className="h-8 lg:h-12 bg-gray-200 dark:bg-dark-gray rounded w-3/4 mb-2" />
            <div className="h-6 lg:h-8 bg-gray-200 dark:bg-dark-gray rounded w-1/2" />
          </div>

          {/* Quote Section Skeleton */}
          <div className="rounded-lg p-4 bg-gradient-to-r from-dark-blue to-light-blue dark:from-blue-900/30 dark:to-cyan-900/30">
            <div className="h-4 bg-blue-200/50 dark:bg-blue-800/30 rounded w-full mb-2" />
            <div className="h-4 bg-blue-200/50 dark:bg-blue-800/30 rounded w-5/6 mb-2" />
            <div className="h-4 bg-blue-200/50 dark:bg-blue-800/30 rounded w-3/4" />
          </div>

          {/* Badges Skeleton */}
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-24 bg-gray-200 dark:bg-dark-gray rounded-full" />
            <div className="h-6 w-32 bg-gray-200 dark:bg-dark-gray rounded-full" />
            <div className="h-6 w-28 bg-gray-200 dark:bg-dark-gray rounded-full" />
          </div>

          {/* Metadata Grid Skeleton */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {/* Locations */}
            <div className="space-y-2">
              <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
              <div className="h-7 w-full bg-pink-100 dark:bg-pink-900/30 rounded" />
              <div className="h-7 w-3/4 bg-pink-100 dark:bg-pink-900/30 rounded" />
            </div>

            {/* Time Periods */}
            <div className="space-y-2">
              <div className="h-3 w-20 bg-gray-300 dark:bg-gray-600 rounded" />
              <div className="h-7 w-full bg-yellow-100 dark:bg-yellow-900/30 rounded" />
              <div className="h-7 w-2/3 bg-yellow-100 dark:bg-yellow-900/30 rounded" />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <div className="h-3 w-18 bg-gray-300 dark:bg-gray-600 rounded" />
              <div className="h-7 w-full bg-cyan-100 dark:bg-cyan-900/30 rounded" />
              <div className="h-7 w-4/5 bg-cyan-100 dark:bg-cyan-900/30 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Skeleton */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
        {/* Similar Mysteries Placeholder */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="h-5 w-40 bg-gray-200 dark:bg-dark-gray rounded mb-4" />
        </div>
      </div>
    </div>
  );
}
