export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-5xl animate-pulse">
      {/* Header skeleton */}
      <div className="mb-10">
        <div className="h-3 w-32 bg-crime-muted rounded mb-3" />
        <div className="h-8 w-64 bg-crime-muted rounded mb-2" />
        <div className="h-4 w-48 bg-crime-muted/50 rounded" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[1,2,3,4].map(i => (
          <div key={i} className="card p-5">
            <div className="flex justify-between mb-3">
              <div className="h-3 w-24 bg-crime-muted rounded" />
              <div className="h-4 w-4 bg-crime-muted rounded" />
            </div>
            <div className="h-9 w-16 bg-crime-muted rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1,2].map(i => (
          <div key={i} className="card p-5">
            <div className="h-3 w-32 bg-crime-muted rounded mb-5" />
            <div className="space-y-3">
              {[1,2,3].map(j => (
                <div key={j} className="h-14 bg-crime-muted/50 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
