export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full border-4 border-[#1B4332] border-t-transparent animate-spin"
          aria-label="Loading"
          role="status"
        />
        <p className="text-sm font-medium text-gray-500">Loading&hellip;</p>
      </div>
    </div>
  )
}
