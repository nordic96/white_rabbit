import { HiExclamationCircle } from 'react-icons/hi';

interface ErrorStateProps {
  error: Error | string;
  onRetry: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  const errorMessage =
    typeof error === 'string' ? error : error.message || 'An error occurred';

  return (
    <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
      <HiExclamationCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-dark-gray dark:text-gray-300 mb-2">
        Error loading mysteries
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
        {errorMessage}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
