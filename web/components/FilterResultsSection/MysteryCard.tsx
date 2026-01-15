import { useMysteryStore } from '@/store/mysteryStore';
import { MysteryItem } from '@/types';
import { cn, wrapAdBc } from '@/utils';
import Image from 'next/image';
import { HiQuestionMarkCircle } from 'react-icons/hi';
import ConfidenceScore from './ConfidenceScore';

interface MysteryCardProps {
  item: MysteryItem;
}

export default function MysteryCard({ item }: MysteryCardProps) {
  const { id, title, image_source, first_reported_year, confidence_score } =
    item;
  const setSelectedId = useMysteryStore((state) => state.setSelectedId);

  const hasImage = image_source && image_source.length > 0;

  const handleClick = () => {
    setSelectedId(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200',
        'bg-dark-secondary',
        'border',
        'hover:border-mystery-purple',
        'hover:shadow-lg hover:shadow-black/20',
        'hover:-translate-y-0.5',
        'focus:outline-none focus:ring-1 focus:ring-mystery-purple focus:ring-offset-1 focus:ring-offset-mystery-purple',
      )}
    >
      <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-dark-gray">
        {hasImage ? (
          <Image
            src={image_source[0]}
            alt={`${title} thumbnail`}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HiQuestionMarkCircle className="w-8 h-8 text-gray-500" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h2 className="text-white line-clamp-2 leading-tight">{title}</h2>

        {first_reported_year && (
          <p className="text-sm text-gray-400 mt-1">
            ~{wrapAdBc(first_reported_year)}
          </p>
        )}

        {confidence_score !== undefined && (
          <div className="mt-1.5">
            <ConfidenceScore score={confidence_score} />
          </div>
        )}
      </div>
    </div>
  );
}
