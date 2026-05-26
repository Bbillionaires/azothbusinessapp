'use client';

import { useState } from 'react';
import { Search, UserCheck, ShieldOff, Eye } from 'lucide-react';

const MOCK_USERS = [
  { id: '1', name: 'Marcus Johnson', email: 'marcus@example.com', tier: 'gold', role: 'consumer', points: 4250, receipts: 47, reviews: 12, referrals: 8, status: 'active', joined: '2023-02-14', is_legend: false },
  { id: '2', name: 'Tanisha Williams', email: 'tanisha@example.com', tier: 'legend', role: 'consumer', points: 18500, receipts: 203, reviews: 67, referrals: 45, status: 'active', joined: '2022-08-01', is_legend: true },
  { id: '3', name: 'Jerome Davis', email: 'jerome@example.com', tier: 'silver', role: 'consumer', points: 820, receipts: 12, reviews: 3, referrals: 2, status: 'active', joined: '2024-01-10' },
  { id: '4', name: 'Aaliyah Brown', email: 'aaliyah@example.com', tier: 'bronze', role: 'consumer', points: 150, receipts: 3, reviews: 1, referrals: 0, status: 'flagged', joined: '2024-04-20' },
  { id: '5', name: 'DeShawn Martin', email: 'deshawn@example.com', tier: 'platinum', role: 'consumer', points: 9200, receipts: 98, reviews: 34, referrals: 22, status: 'active', joined: '2022-11-15' },
];

const TIER_STYLES: Record<string, string> = {
  bronze: 'bg-yellow-900/30 text-yellow-500',
  silver: 'bg-slate-600 text-gray-300',
  gold: 'bg-yellow-700/30 text-yellow-300',
  platinum: 'bg-blue-900/30 text-blue-300',
  legend: 'bg-green-900/30 text-green-300',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = MOCK_USERS.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === 'All' || u.tier === tierFilter.toLowerCase();
    const matchStatus = statusFilter === 'All' || u.status === statusFilter.toLowerCase();
    return matchSearch && matchTier && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Users</h1>
        <p className="text-gray-400 mt-1">Manage consumer accounts, tiers, and access</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Users', value: MOCK_USERS.length },
          { label: 'Legends', value: MOCK_USERS.filter(u => u.is_legend).length },
          { label: 'Gold+', value: MOCK_USERS.filter(u => ['gold','platinum','legend'].includes(u.tier)).length },
          { label: 'Flagged', value: MOCK_USERS.filter(u => u.status === 'flagged').length },
          { label: 'New (30d)', value: 2 },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
            <div className="text-2xl font-bold text-gray-100">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex gap-4 flex-wrap">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200"
        >
          {['All', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Legend'].map(t => <option key={t}>{t}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200"
        >
          {['All', 'Active', 'Flagged', 'Suspended'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['User', 'Tier', 'Points', 'Receipts', 'Reviews', 'Referrals', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide first:pl-6 last:pr-6 last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="pl-6 pr-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-300">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-200 flex items-center gap-1">
                          {user.name}
                          {user.is_legend && <span className="text-xs">👑</span>}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${TIER_STYLES[user.tier]}`}>
                      {user.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-400">{user.points.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{user.receipts}</td>
                  <td className="px-4 py-3 text-gray-300">{user.reviews}</td>
                  <td className="px-4 py-3 text-gray-300">{user.referrals}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      user.status === 'active' ? 'bg-green-900/40 text-green-400' :
                      user.status === 'flagged' ? 'bg-yellow-900/40 text-yellow-400' :
                      'bg-red-900/40 text-red-400'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{user.joined}</td>
                  <td className="pl-4 pr-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-gray-400 hover:text-gray-200 p-1" title="View">
                        <Eye size={14} />
                      </button>
                      <button className="text-gray-400 hover:text-green-400 p-1" title="Verify">
                        <UserCheck size={14} />
                      </button>
                      <button className="text-gray-400 hover:text-red-400 p-1" title="Suspend">
                        <ShieldOff size={14} />
                      </button>
                    </div>
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
