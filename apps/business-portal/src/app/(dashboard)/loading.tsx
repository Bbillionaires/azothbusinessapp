export default function DashboardGroupLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="mb-6">
        <div className="h-7 w-48 bg-gray-200 rounded-md mb-2" />
        <div className="h-4 w-72 bg-gray-100 rounded-md" />
      </div>

      {/* Stats cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 bg-gray-100 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
