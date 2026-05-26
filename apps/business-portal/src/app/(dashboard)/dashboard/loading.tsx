export default function DashboardPageLoading() {
  return (
    <div className="p-6 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-7 w-40 bg-gray-200 rounded-md mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded-md" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-9 w-9 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-28 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Two-column content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="h-5 w-32 bg-gray-200 rounded mb-5" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-9 w-9 bg-gray-100 rounded-full shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-4/5" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Quick stats panel */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                  <div className="h-4 w-12 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent reviews panel */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <div key={s} className="h-3 w-3 bg-gray-100 rounded" />
                    ))}
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
