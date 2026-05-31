'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Loader2 } from 'lucide-react';
import { RoleGuard } from '../../../components/layout/RoleGuard';
import { createBrowserClient } from '@supabase/ssr';
import { format } from 'date-fns';

type AuditLog = {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null; role: string | null } | null;
};

const ACTION_COLORS: Record<string, string> = {
  approve_receipt: 'bg-green-900/40 text-green-400',
  reject_receipt: 'bg-red-900/40 text-red-400',
  suspend_user: 'bg-red-900/40 text-red-400',
  change_role: 'bg-yellow-900/40 text-yellow-400',
  verify_business: 'bg-blue-900/40 text-blue-400',
  feature_business: 'bg-blue-900/40 text-blue-400',
  promote_legend: 'bg-purple-900/40 text-purple-400',
  send_notification: 'bg-cyan-900/40 text-cyan-400',
};

const ROLE_COLORS: Record<string, string> = {
  admin_staff: 'text-gray-400',
  admin_manager: 'text-blue-400',
  super_admin: 'text-purple-400',
};

export default function AuditPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, profiles!actor_id(full_name, email, role)')
        .order('created_at', { ascending: false })
        .limit(200);
      setLogs((data ?? []) as AuditLog[]);
      setLoading(false);
    }
    load();
  }, []);

  const uniqueActions = ['All', ...Array.from(new Set(logs.map(l => l.action)))];

  const filtered = logs.filter(log => {
    const actor = log.profiles?.full_name ?? log.profiles?.email ?? log.actor_id;
    const matchSearch = !search ||
      actor.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.target_type.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'All' || log.action === actionFilter;
    const matchRole = roleFilter === 'All' || log.profiles?.role === roleFilter;
    return matchSearch && matchAction && matchRole;
  });

  function downloadCSV() {
    const rows = [['Timestamp', 'Actor', 'Role', 'Action', 'Target Type', 'Target ID', 'IP']];
    filtered.forEach(log => {
      rows.push([
        log.created_at,
        log.profiles?.full_name ?? log.profiles?.email ?? log.actor_id,
        log.profiles?.role ?? '',
        log.action,
        log.target_type,
        log.target_id ?? '',
        log.ip_address ?? '',
      ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Audit Logs</h1>
            <p className="text-gray-400 mt-1">Complete record of all admin actions — Super Admin only</p>
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-gray-200 px-4 py-2 rounded-xl font-semibold text-sm"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-wrap gap-4">
          <div className="flex-1 relative min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500"
            />
          </div>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200"
          >
            {uniqueActions.map(a => <option key={a} value={a}>{a === 'All' ? 'All Actions' : a.replace(/_/g, ' ')}</option>)}
          </select>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200"
          >
            <option value="All">All Roles</option>
            <option value="admin_staff">Admin Staff</option>
            <option value="admin_manager">Admin Manager</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        {/* Log table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-700">
            <span className="text-sm text-gray-400">{filtered.length} entries</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              {logs.length === 0 ? 'No audit logs yet. Actions taken by admins will appear here.' : 'No logs match your filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Timestamp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Target</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(log => {
                    const actor = log.profiles?.full_name ?? log.profiles?.email ?? log.actor_id.slice(0, 8);
                    const role = log.profiles?.role ?? 'unknown';
                    return (
                      <tr key={log.id} className="border-b border-slate-700/40 hover:bg-slate-700/20 font-mono text-xs">
                        <td className="px-6 py-3 text-gray-400 whitespace-nowrap">
                          {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`font-semibold ${ROLE_COLORS[role] ?? 'text-gray-300'}`}>{actor}</div>
                          <div className="text-gray-600 capitalize">{role.replace(/_/g, ' ')}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${ACTION_COLORS[log.action] ?? 'bg-slate-700 text-gray-400'}`}>
                            {log.action.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          <span className="capitalize">{log.target_type}</span>
                          {log.target_id && <span className="text-gray-500"> #{log.target_id.slice(0, 8)}</span>}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="text-gray-500 truncate max-w-xs">
                              {JSON.stringify(log.metadata).slice(0, 60)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{log.ip_address ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
