'use client';

import { useState } from 'react';
import { Megaphone, Eye, MousePointer, DollarSign, Play, Pause, BarChart3 } from 'lucide-react';

const MOCK_CAMPAIGNS = [
  { id: '1', advertiser: 'Greenwood Coffee Co.', type: 'sponsored_listing', budget: 49, spent: 32.40, impressions: 1240, clicks: 87, status: 'active', city: 'Jacksonville', category: 'Restaurant', start: '2024-05-01', end: '2024-05-31' },
  { id: '2', advertiser: 'LaVilla Hair Studio', type: 'banner_ad', budget: 99, spent: 99, impressions: 3420, clicks: 204, status: 'completed', city: 'Jacksonville', category: 'Beauty', start: '2024-04-01', end: '2024-04-30' },
  { id: '3', advertiser: 'Downtown Events Group', type: 'push_notification', budget: 29, spent: 29, impressions: 8900, clicks: 534, status: 'completed', city: 'Jacksonville', category: 'Events', start: '2024-04-20', end: '2024-04-20' },
  { id: '4', advertiser: 'Eastside Fitness', type: 'sponsored_listing', budget: 49, spent: 12.10, impressions: 340, clicks: 18, status: 'paused', city: 'Jacksonville', category: 'Fitness', start: '2024-05-10', end: '2024-05-31' },
];

const TYPE_LABELS: Record<string, string> = {
  sponsored_listing: 'Sponsored Listing',
  banner_ad: 'Banner Ad',
  push_notification: 'Push Notification',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-900/40 text-green-400',
  completed: 'bg-slate-600 text-gray-400',
  paused: 'bg-yellow-900/40 text-yellow-400',
  pending: 'bg-blue-900/40 text-blue-400',
};

export default function AdminAdvertisingPage() {
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = MOCK_CAMPAIGNS.filter(c =>
    statusFilter === 'All' || c.status === statusFilter.toLowerCase()
  );

  const totalRevenue = MOCK_CAMPAIGNS.reduce((s, c) => s + c.spent, 0);
  const totalImpressions = MOCK_CAMPAIGNS.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = MOCK_CAMPAIGNS.reduce((s, c) => s + c.clicks, 0);
  const activeCampaigns = MOCK_CAMPAIGNS.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Advertising Management</h1>
        <p className="text-gray-400 mt-1">Oversee all advertiser campaigns and revenue</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ad Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: <DollarSign size={18} />, color: 'text-green-400' },
          { label: 'Total Impressions', value: totalImpressions.toLocaleString(), icon: <Eye size={18} />, color: 'text-blue-400' },
          { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: <MousePointer size={18} />, color: 'text-purple-400' },
          { label: 'Active Campaigns', value: activeCampaigns, icon: <Play size={18} />, color: 'text-yellow-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className={`${s.color} mb-2`}>{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['All', 'Active', 'Paused', 'Completed'].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statusFilter === f ? 'bg-green-700 text-white' : 'bg-slate-800 text-gray-400 border border-slate-700 hover:border-slate-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Campaigns table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Advertiser', 'Type', 'Budget', 'Spent', 'Impressions', 'Clicks', 'CTR', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide first:pl-6 last:pr-6 last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const ctr = ((c.clicks / c.impressions) * 100).toFixed(1);
                const budgetPct = (c.spent / c.budget) * 100;
                return (
                  <tr key={c.id} className="border-b border-slate-700/40 hover:bg-slate-700/20">
                    <td className="pl-6 pr-4 py-3">
                      <div className="font-medium text-gray-200">{c.advertiser}</div>
                      <div className="text-xs text-gray-500">{c.city} · {c.category}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-700 text-gray-300 px-2 py-0.5 rounded-full font-semibold">
                        {TYPE_LABELS[c.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">${c.budget}</td>
                    <td className="px-4 py-3">
                      <div className="text-green-400 font-semibold">${c.spent.toFixed(2)}</div>
                      <div className="w-16 h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{c.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-300">{c.clicks}</td>
                    <td className="px-4 py-3 text-gray-300">{ctr}%</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="pl-4 pr-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-gray-400 hover:text-blue-400 p-1" title="Analytics"><BarChart3 size={14} /></button>
                        {c.status === 'active'
                          ? <button className="text-gray-400 hover:text-yellow-400 p-1" title="Pause"><Pause size={14} /></button>
                          : c.status === 'paused'
                          ? <button className="text-gray-400 hover:text-green-400 p-1" title="Resume"><Play size={14} /></button>
                          : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
