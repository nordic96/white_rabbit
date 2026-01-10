'use client';

import { SimilarMystery } from '@/types/mystery';

interface SimilarMysteryCardProps {
  mystery: SimilarMystery;
  onClick: (id: string) => void;
}

export default function SimilarMysteryCard({
  mystery,
  onClick,
}: SimilarMysteryCardProps) {
  const handleClick = () => {
    onClick(mystery.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(mystery.id);
    }
  };

  const similarityPercentage = Math.round(mystery.score * 100);
  const displayReasons = mystery.reasons.slice(0, 2);
  const remainingConnections = mystery.reasons.length - 2;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {mystery.title}
        </h4>
        <span className="ml-2 flex-shrink-0 inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400">
          <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
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
              <svg className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}

      {remainingConnections > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          +{remainingConnections} more connection{remainingConnections !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
