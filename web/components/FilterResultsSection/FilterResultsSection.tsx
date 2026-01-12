'use client';

import { useFilterStore } from '@/store';
import FilterHeader from './FilterHeader';
import MysteryCard from './MysteryCard';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import { getFilterMetadata } from './helpers';

export default function FilterResultsSection() {
  const {
    filterId,
    filteredMysteries,
    loading,
    error,
    setFilter,
    unSelectFilter,
  } = useFilterStore();

  const metadata = getFilterMetadata(filterId);

  const renderContent = () => {
    if (loading) return <LoadingState />;

    if (error) {
      return (
        <ErrorState
          error={error}
          onRetry={() => filterId && setFilter(filterId)}
        />
      );
    }

    if (filteredMysteries.length === 0) return <EmptyState />;

    return (
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
        {filteredMysteries.map((item) => (
          <MysteryCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-dark-gray">
      {metadata && (
        <FilterHeader
          metadata={metadata}
          count={loading || error ? 0 : filteredMysteries.length}
          onClose={unSelectFilter}
        />
      )}
      {renderContent()}
    </div>
  );
}
