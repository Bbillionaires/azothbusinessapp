import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <span className="text-8xl font-black text-[#1B4332]">404</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-[#1B4332] text-white font-semibold rounded-lg hover:bg-[#14532D] transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
