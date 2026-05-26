'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-6">{error.message || 'An unexpected error occurred.'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-6 py-2 bg-[#1B4332] text-white font-semibold rounded-lg hover:bg-[#14532D]">
            Try again
          </button>
          <Link href="/dashboard" className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
