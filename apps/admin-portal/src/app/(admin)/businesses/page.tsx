'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, MapPin, Star, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import BusinessStatusBadge from '../../../components/businesses/BusinessStatusBadge';
import VerificationActions from '../../../components/businesses/VerificationActions';

interface BusinessRow {
  id: string;
  name: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  verification_level: string | null;
  is_local_owned: boolean | null;
  is_community_owned: boolean | null;
  created_at: string | null;
}

const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Suspended'];
const VERIFICATION_FILTERS = ['All', 'None', 'Basic', 'Pro', 'Elite', 'Community Trusted'];

export default function BusinessesPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [verifFilter, setVerifFilter] = useState('All');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchBusinesses() {
      setLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, category, city, state, status, verification_level, is_local_owned, is_community_owned, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && data) {
        setBusinesses(data as BusinessRow[]);
      }
      setLoading(false);
    }
    fetchBusinesses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSuspend(id: string) {
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status: 'suspended' } : b));
    await supabase
      .from('businesses')
      .update({ status: 'suspended' })
      .eq('id', id);
  }

  async function handleApprove(id: string) {
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status: 'active' } : b));
    await supabase
      .from('businesses')
      .update({ status: 'active' })
      .eq('id', id);
  }

  const filtered = businesses.filter(b => {
    const name = b.name ?? '';
    const city = b.city ?? '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      city.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || (b.status ?? '') === statusFilter.toLowerCase();
    const matchVerif = verifFilter === 'All' || (b.verification_level ?? 'none') === verifFilter.toLowerCase().replace(' ', '_');
    return matchSearch && matchStatus && matchVerif;
  });

  const stats = {
    total: businesses.length,
    active: businesses.filter(b => b.status === 'active').length,
    pending: businesses.filter(b => b.status === 'pending').length,
    suspended: businesses.filter(b => b.status === 'suspended').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Businesses</h1>
          <p className="text-gray-400 mt-1">Manage and moderate all registered businesses</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-100' },
          { label: 'Active', value: stats.active, color: 'text-green-400' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Suspended', value: stats.suspended, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-wrap gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search businesses..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200"
        >
          {STATUS_FILTERS.map(f => <option key={f}>{f}</option>)}
        </select>
        <select
          value={verifFilter}
          onChange={e => setVerifFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200"
        >
          {VERIFICATION_FILTERS.map(f => <option key={f}>{f}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading businesses...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
            No businesses found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Business</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Verification</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Badges</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(biz => (
                  <tr key={biz.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-900 flex items-center justify-center">
                          <Building2 size={16} className="text-green-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-100">{biz.name ?? '—'}</div>
                          <div className="text-xs text-gray-500">{biz.category ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-gray-400 text-sm">
                        <MapPin size={13} />
                        {biz.city ?? '—'}, {biz.state ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <BusinessStatusBadge status={biz.status ?? 'pending'} />
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        biz.verification_level === 'elite' ? 'bg-yellow-900/50 text-yellow-400' :
                        biz.verification_level === 'pro' ? 'bg-green-900/50 text-green-400' :
                        biz.verification_level === 'basic' ? 'bg-slate-600 text-gray-300' :
                        'bg-slate-700 text-gray-500'
                      }`}>
                        {!biz.verification_level || biz.verification_level === 'none'
                          ? 'Unverified'
                          : biz.verification_level.charAt(0).toUpperCase() + biz.verification_level.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {biz.is_local_owned && <span title="Local Owned" className="text-sm">🏠</span>}
                        {biz.is_community_owned && <span title="Community Owned" className="text-sm">🤝</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <VerificationActions
                          businessId={biz.id}
                          businessName={biz.name ?? ''}
                          currentStatus={(biz.status ?? 'pending') as import('@/lib/supabase').BusinessStatus}
                          onStatusChange={(newStatus) => {
                            setBusinesses(prev => prev.map(b => b.id === biz.id ? { ...b, status: newStatus } : b));
                          }}
                        />
                        <button
                          onClick={() => router.push(`/businesses/${biz.id}`)}
                          className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
