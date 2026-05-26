'use client';

import { useState } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import { RoleGuard } from '../../../components/layout/RoleGuard';

const MOCK_AUDIT_LOGS = [
  { id: '1', actor: 'admin@localfirstrewards.com', action: 'RECEIPT_APPROVED', target: 'Receipt #REC-4821', ip: '192.168.1.1', timestamp: '2024-05-26 14:32:18', role: 'admin_staff' },
  { id: '2', actor: 'manager@localfirstrewards.com', action: 'BUSINESS_SUSPENDED', target: 'Business #BIZ-0234', ip: '10.0.0.5', timestamp: '2024-05-26 13:15:44', role: 'admin_manager' },
  { id: '3', actor: 'super@localfirstrewards.com', action: 'SETTINGS_UPDATED', target: 'points_per_dollar → 1.5', ip: '10.0.0.1', timestamp: '2024-05-26 11:02:09', role: 'super_admin' },
  { id: '4', actor: 'manager@localfirstrewards.com', action: 'VERIFICATION_GRANTED', target: 'Business: Greenwood Coffee (Elite)', ip: '10.0.0.5', timestamp: '2024-05-26 10:44:31', role: 'admin_manager' },
  { id: '5', actor: 'admin@localfirstrewards.com', action: 'USER_FLAGGED', target: 'User #USR-9921 (fraud)', ip: '192.168.1.1', timestamp: '2024-05-26 09:28:55', role: 'admin_staff' },
  { id: '6', actor: 'super@localfirstrewards.com', action: 'LEGEND_INDUCTED', target: 'Tanisha Williams → Hall of Legends', ip: '10.0.0.1', timestamp: '2024-05-25 16:00:00', role: 'super_admin' },
  { id: '7', actor: 'manager@localfirstrewards.com', action: 'REWARD_CREATED', target: 'Reward: 10% Off at Local Biz', ip: '10.0.0.5', timestamp: '2024-05-25 14:22:13', role: 'admin_manager' },
  { id: '8', actor: 'admin@localfirstrewards.com', action: 'RECEIPT_REJECTED', target: 'Receipt #REC-4799 (duplicate)', ip: '192.168.1.2', timestamp: '2024-05-25 11:05:44', role: 'admin_staff' },
];

const ACTION_COLORS: Record<string, string> = {
  RECEIPT_APPROVED: 'bg-green-900/40 text-green-400',
  RECEIPT_REJECTED: 'bg-red-900/40 text-red-400',
  BUSINESS_SUSPENDED: 'bg-red-900/40 text-red-400',
  BUSINESS_APPROVED: 'bg-green-900/40 text-green-400',
  SETTINGS_UPDATED: 'bg-yellow-900/40 text-yellow-400',
  VERIFICATION_GRANTED: 'bg-blue-900/40 text-blue-400',
  USER_FLAGGED: 'bg-orange-900/40 text-orange-400',
  LEGEND_INDUCTED: 'bg-purple-900/40 text-purple-400',
  REWARD_CREATED: 'bg-cyan-900/40 text-cyan-400',
};

const ROLE_COLORS: Record<string, string> = {
  admin_staff: 'text-gray-400',
  admin_manager: 'text-blue-400',
  super_admin: 'text-purple-400',
};

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  const filtered = MOCK_AUDIT_LOGS.filter(log => {
    const matchSearch = log.actor.includes(search) || log.target.toLowerCase().includes(search.toLowerCase()) || log.action.includes(search.toUpperCase());
    const matchAction = actionFilter === 'All' || log.action === actionFilter;
    const matchRole = roleFilter === 'All' || log.role === roleFilter;
    return matchSearch && matchAction && matchRole;
  });

  const uniqueActions = ['All', ...new Set(MOCK_AUDIT_LOGS.map(l => l.action))];

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Audit Logs</h1>
            <p className="text-gray-400 mt-1">Complete record of all admin actions — Super Admin only</p>
          </div>
          <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-gray-200 px-4 py-2 rounded-xl font-semibold text-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-wrap gap-4">
          <div className="flex-1 relative">
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
            {uniqueActions.map(a => <option key={a}>{a}</option>)}
          </select>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200"
          >
            <option>All</option>
            <option value="admin_staff">Admin Staff</option>
            <option value="admin_manager">Admin Manager</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        {/* Log table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-700 flex items-center justify-between">
            <span className="text-sm text-gray-400">{filtered.length} entries</span>
          </div>
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
                {filtered.map(log => (
                  <tr key={log.id} className="border-b border-slate-700/40 hover:bg-slate-700/20 font-mono text-xs">
                    <td className="px-6 py-3 text-gray-400">{log.timestamp}</td>
                    <td className="px-4 py-3">
                      <div className={`font-semibold ${ROLE_COLORS[log.role] ?? 'text-gray-300'}`}>
                        {log.actor}
                      </div>
                      <div className="text-gray-600 text-xs capitalize">{log.role.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${ACTION_COLORS[log.action] ?? 'bg-slate-700 text-gray-400'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{log.target}</td>
                    <td className="px-4 py-3 text-gray-500">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
