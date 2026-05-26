import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-slate-100 mb-3">Access Denied</h1>

        {/* Message */}
        <p className="text-slate-400 mb-2 text-base leading-relaxed">
          You do not have permission to access this admin portal.
        </p>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          This area is restricted to authorized admin staff only. If you believe
          this is an error, contact your system administrator.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-brand-green-500 hover:bg-brand-green-600 text-white font-medium text-sm transition-colors"
          >
            Back to Login
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-slate-600">
          Local First Rewards &mdash; Internal Admin Portal
        </p>
      </div>
    </div>
  )
}
