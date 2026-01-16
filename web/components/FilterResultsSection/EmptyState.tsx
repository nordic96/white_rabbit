import { HiSearch } from 'react-icons/hi';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
      <HiSearch className="w-12 h-12 text-gray-600 mb-4" />
      <h3 className="text-lg font-medium text-gray-300 mb-2">
        No mysteries found
      </h3>
      <p className="text-sm text-gray-500">
        No mysteries match this filter. Try selecting a different node.
      </p>
    </div>
  );
}
