function SkeletonCard() {
  return (
    <div className="stat-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="h-7 w-28 bg-neutral-100 dark:bg-neutral-800 rounded mt-2 animate-pulse" />
          <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800 rounded mt-3 animate-pulse" />
        </div>
        <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="card">
      <div className="card-header"><div className="h-4 w-32 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" /></div>
      <div className="space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 px-5 border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
            <div className="h-3 w-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-3 w-14 bg-neutral-100 dark:bg-neutral-800 rounded ml-auto animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="hero-section !py-12">
        <div className="h-4 w-24 bg-orange-100 dark:bg-orange-900/30 rounded animate-pulse mb-2" />
        <div className="h-9 w-48 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse mb-2" />
        <div className="h-3 w-72 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3"><SkeletonTable /></div>
        <div className="lg:col-span-2"><SkeletonTable /></div>
      </div>
    </div>
  );
}

export { SkeletonCard, SkeletonTable, DashboardSkeleton };
