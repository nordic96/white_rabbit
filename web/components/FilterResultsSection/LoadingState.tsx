function SkeletonCard() {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-dark-secondary animate-pulse">
      <div className="w-20 h-20 shrink-0 rounded-md bg-gray-200" />
      <div className="flex-1 flex flex-col justify-center gap-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function LoadingState() {
  return (
    <div className="p-4 space-y-3">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
