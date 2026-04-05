function SkeletonCard() {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="h-2.5 w-16 shimmer rounded-md" />
          <div className="h-5 w-24 shimmer rounded-md mt-2" />
        </div>
        <div className="w-7 h-7 shimmer rounded-lg" />
      </div>
      <div className="h-2.5 w-20 shimmer rounded-md" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/50">
        <div className="h-3 w-28 shimmer rounded-md" />
      </div>
      <div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2.5 px-4 border-b border-neutral-50 dark:border-neutral-800/30 last:border-0">
            <div className="h-2.5 w-14 shimmer rounded" />
            <div className="h-2.5 w-20 shimmer rounded" />
            <div className="h-2.5 w-16 shimmer rounded" />
            <div className="h-2.5 w-12 shimmer rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 stagger">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 shimmer rounded-md" />
        <div className="h-8 w-36 shimmer rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3"><SkeletonTable /></div>
        <div className="lg:col-span-2"><SkeletonTable /></div>
      </div>
    </div>
  );
}

export { SkeletonCard, SkeletonTable, DashboardSkeleton };
