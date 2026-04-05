function SkeletonCard() {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-16 animate-pulse" />
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mt-1.5 animate-pulse" />
        </div>
        <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="card">
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20 animate-pulse" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-28 animate-pulse" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-16 animate-pulse" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-14 ml-auto animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse ${i === lines - 1 ? 'w-2/3' : ''}`} />
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-32 animate-pulse" />
        <div className="h-9 bg-neutral-200 dark:bg-neutral-700 rounded-md w-36 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card"><SkeletonTable /></div>
        <div className="card"><SkeletonTable /></div>
      </div>
    </div>
  );
}

export { SkeletonCard, SkeletonTable, SkeletonText, DashboardSkeleton };
