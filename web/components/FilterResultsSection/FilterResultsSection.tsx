import { useFilterStore } from '@/store';
import { MysteryItem } from '@/types';
import Image from 'next/image';

export default function FilterResultsSection() {
  const { loading, filteredMysteries, error } = useFilterStore();
  return (
    <div>
      {filteredMysteries.length === 0 ? 'Mysteries Empty' : ''}
      {loading ? 'loading mysteries...' : ''}
      {error ? 'Error while fetching mysteries.. please try again' : ''}
      <div className={'flex flex-col gap-4'}>
        {filteredMysteries.length > 0 &&
          filteredMysteries.map((item) => (
            <MysteryCard key={item.id} item={item} />
          ))}
      </div>
    </div>
  );
}

function MysteryCard({ item }: { item: MysteryItem }) {
  const { id, title, image_source } = item;
  return (
    <div className={'flex border-0.5 rounded-lg shadow-lg'}>
      {image_source && image_source.length > 0 && (
        <Image
          src={image_source[0]}
          alt={`thumbnail-${id}`}
          width={120}
          height={80}
          className={'aspect-auto'}
        />
      )}
      <div className={'flex items-center py-1'}>
        <h2 className={'text-xl'}>{title}</h2>
      </div>
    </div>
  );
}
