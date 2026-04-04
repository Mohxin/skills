function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24 mb-2"></div>
          <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-32"></div>
        </div>
        <div className="w-12 h-12 bg-surface-200 dark:bg-surface-700 rounded-lg"></div>
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24"></div>
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-32"></div>
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-20"></div>
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-16 ml-auto"></div>
        </div>
      ))}
    </div>
  );
}

function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-4 bg-surface-200 dark:bg-surface-700 rounded animate-pulse ${i === lines - 1 ? 'w-2/3' : ''}`}></div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-32 animate-pulse"></div>
        <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded-lg w-28 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
