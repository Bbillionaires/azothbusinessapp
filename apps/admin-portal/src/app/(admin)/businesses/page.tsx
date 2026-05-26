'use client';

import { useState } from 'react';
import { Search, Filter, Building2, ShieldCheck, MapPin, Star } from 'lucide-react';
import { BusinessStatusBadge } from '../../../components/businesses/BusinessStatusBadge';
import { VerificationActions } from '../../../components/businesses/VerificationActions';

const MOCK_BUSINESSES = [
  { id: '1', name: 'Greenwood Coffee Co.', category: 'Restaurant', city: 'Jacksonville', state: 'FL', status: 'active', verification_level: 'pro', rating: 4.8, reviews: 124, is_local_owned: true, is_community_owned: true, created_at: '2022-03-15' },
  { id: '2', name: 'LaVilla Hair Studio', category: 'Beauty', city: 'Jacksonville', state: 'FL', status: 'active', verification_level: 'basic', rating: 4.5, reviews: 67, is_local_owned: true, is_community_owned: false, created_at: '2023-07-01' },
  { id: '3', name: 'Northside Auto Repair', category: 'Services', city: 'Jacksonville', state: 'FL', status: 'pending', verification_level: 'none', rating: null, reviews: 0, is_local_owned: true, is_community_owned: false, created_at: '2024-05-20' },
  { id: '4', name: 'Eastside Fitness Center', category: 'Fitness', city: 'Jacksonville', state: 'FL', status: 'suspended', verification_level: 'none', rating: 3.2, reviews: 18, is_local_owned: false, is_community_owned: false, created_at: '2021-11-10' },
  { id: '5', name: 'Community Arts Collective', category: 'Entertainment', city: 'Jacksonville', state: 'FL', status: 'active', verification_level: 'elite', rating: 4.9, reviews: 203, is_local_owned: true, is_community_owned: true, created_at: '2018-06-22' },
];

const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Suspended'];
const VERIFICATION_FILTERS = ['All', 'None', 'Basic', 'Pro', 'Elite', 'Community Trusted'];

export default function BusinessesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [verifFilter, setVerifFilter] = useState('All');
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);

  const filtered = MOCK_BUSINESSES.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || b.status === statusFilter.toLowerCase();
    const matchVerif = verifFilter === 'All' || b.verification_level === verifFilter.toLowerCase().replace(' ', '_');
    return matchSearch && matchStatus && matchVerif;
  });

  const stats = {
    total: MOCK_BUSINESSES.length,
    active: MOCK_BUSINESSES.filter(b => b.status === 'active').length,
    pending: MOCK_BUSINESSES.filter(b => b.status === 'pending').length,
    suspended: MOCK_BUSINESSES.filter(b => b.status === 'suspended').length,
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Business</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Verification</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rating</th>
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
                        <div className="font-medium text-gray-100">{biz.name}</div>
                        <div className="text-xs text-gray-500">{biz.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <MapPin size={13} />
                      {biz.city}, {biz.state}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <BusinessStatusBadge status={biz.status} />
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      biz.verification_level === 'elite' ? 'bg-yellow-900/50 text-yellow-400' :
                      biz.verification_level === 'pro' ? 'bg-green-900/50 text-green-400' :
                      biz.verification_level === 'basic' ? 'bg-slate-600 text-gray-300' :
                      'bg-slate-700 text-gray-500'
                    }`}>
                      {biz.verification_level === 'none' ? 'Unverified' : biz.verification_level.charAt(0).toUpperCase() + biz.verification_level.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {biz.rating ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Star size={13} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-gray-200">{biz.rating}</span>
                        <span className="text-gray-500">({biz.reviews})</span>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      {biz.is_local_owned && <span title="Local Owned" className="text-sm">🏠</span>}
                      {biz.is_community_owned && <span title="Community Owned" className="text-sm">🤝</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <VerificationActions
                      businessId={biz.id}
                      currentStatus={biz.status}
                      onApprove={() => {}}
                      onSuspend={() => {}}
                      onView={() => {}}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
