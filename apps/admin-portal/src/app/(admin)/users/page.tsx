'use client';

import { useState, useEffect } from 'react';
import { Search, UserCheck, ShieldOff, Eye, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  tier: string | null;
  points_balance: number | null;
  is_legend: boolean | null;
  status: string | null;
  created_at: string | null;
}

const TIER_STYLES: Record<string, string> = {
  bronze: 'bg-yellow-900/30 text-yellow-500',
  silver: 'bg-slate-600 text-gray-300',
  gold: 'bg-yellow-700/30 text-yellow-300',
  platinum: 'bg-blue-900/30 text-blue-300',
  legend: 'bg-green-900/30 text-green-300',
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, tier, points_balance, is_legend, status, created_at')
        .not('role', 'in', '("admin_staff","admin_manager","super_admin")')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && data) {
        setUsers(data as UserRow[]);
      }
      setLoading(false);
    }
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSuspend(userId: string) {
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'suspended' } : u));
    await supabase
      .from('profiles')
      .update({ status: 'suspended' })
      .eq('id', userId);
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filtered = users.filter(u => {
    const name = u.full_name ?? '';
    const email = u.email ?? '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === 'All' || (u.tier ?? '') === tierFilter.toLowerCase();
    const matchStatus = statusFilter === 'All' || (u.status ?? '') === statusFilter.toLowerCase();
    return matchSearch && matchTier && matchStatus;
  });

  const stats = [
    { label: 'Total Users', value: users.length },
    { label: 'Legends', value: users.filter(u => u.is_legend).length },
    { label: 'Gold+', value: users.filter(u => ['gold', 'platinum', 'legend'].includes(u.tier ?? '')).length },
    { label: 'Flagged', value: users.filter(u => u.status === 'flagged').length },
    { label: 'New (30d)', value: users.filter(u => u.created_at && new Date(u.created_at) >= thirtyDaysAgo).length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Users</h1>
        <p className="text-gray-400 mt-1">Manage consumer accounts, tiers, and access</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-5 gap-4">
        {stats.map((s, i) => (
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
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading users...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['User', 'Tier', 'Points', 'Status', 'Joined', 'Actions'].map(h => (
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
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-200 flex items-center gap-1">
                            {user.full_name ?? 'Unknown'}
                            {user.is_legend && <span className="text-xs">👑</span>}
                          </div>
                          <div className="text-xs text-gray-500">{user.email ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.tier ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${TIER_STYLES[user.tier] ?? 'bg-slate-700 text-gray-400'}`}>
                          {user.tier}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-400">
                      {(user.points_balance ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        user.status === 'active' ? 'bg-green-900/40 text-green-400' :
                        user.status === 'flagged' ? 'bg-yellow-900/40 text-yellow-400' :
                        'bg-red-900/40 text-red-400'
                      }`}>
                        {user.status ?? 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="pl-4 pr-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-gray-400 hover:text-gray-200 p-1" title="View">
                          <Eye size={14} />
                        </button>
                        <button className="text-gray-400 hover:text-green-400 p-1" title="Verify">
                          <UserCheck size={14} />
                        </button>
                        <button
                          className="text-gray-400 hover:text-red-400 p-1"
                          title="Suspend"
                          onClick={() => handleSuspend(user.id)}
                          disabled={user.status === 'suspended'}
                        >
                          <ShieldOff size={14} />
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
