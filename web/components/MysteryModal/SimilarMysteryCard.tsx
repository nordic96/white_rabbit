import { HiStar, HiCheck } from 'react-icons/hi';
import { SimilarMystery } from '@/types/mystery';

interface SimilarMysteryCardProps {
  mystery: SimilarMystery;
  onClick: (id: string) => void;
}

export default function SimilarMysteryCard({
  mystery,
  onClick,
}: SimilarMysteryCardProps): React.ReactElement {
  const similarityPercentage = Math.round(mystery.score * 100);
  const displayReasons = mystery.reasons.slice(0, 2);
  const remainingConnections = mystery.reasons.length - 2;

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(mystery.id);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(mystery.id)}
      onKeyDown={handleKeyDown}
      className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-gray"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-dark-gray dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {mystery.title}
        </h4>
        <span className="ml-2 shrink-0 inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400">
          <HiStar className="w-3.5 h-3.5 mr-1" />
          {similarityPercentage}%
        </span>
      </div>

      {displayReasons.length > 0 && (
        <ul className="space-y-1">
          {displayReasons.map((reason, index) => (
            <li
              key={index}
              className="flex items-start text-xs text-gray-600 dark:text-gray-400 line-clamp-1"
            >
              <HiCheck className="w-3 h-3 mr-1.5 mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}

      {remainingConnections > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          +{remainingConnections} more connection
          {remainingConnections !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
