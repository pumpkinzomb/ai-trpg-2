const ActivitySkeleton = () => (
  <div className="p-4 bg-muted/30 rounded-lg">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
        <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
      </div>
    </div>
  </div>
);

export default ActivitySkeleton;
