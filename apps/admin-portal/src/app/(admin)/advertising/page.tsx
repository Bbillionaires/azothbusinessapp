'use client';

import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Eye, MousePointer, DollarSign, Play, Pause, BarChart3 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AdCampaign {
  id: string;
  advertiser_id: string;
  business_id: string;
  name: string;
  type: 'sponsored_listing' | 'banner' | 'push_notification';
  budget: number;
  spent: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'rejected';
  impressions: number;
  clicks: number;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  businesses: {
    name: string;
    city: string;
    category: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TYPE_LABELS: Record<string, string> = {
  sponsored_listing: 'Sponsored Listing',
  banner: 'Banner Ad',
  push_notification: 'Push Notification',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-900/40 text-green-400',
  completed: 'bg-slate-600 text-gray-400',
  paused: 'bg-yellow-900/40 text-yellow-400',
  draft: 'bg-slate-700 text-gray-500',
  rejected: 'bg-red-900/40 text-red-400',
};

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminAdvertisingPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch campaigns on mount
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*, businesses(name, city, category)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setCampaigns(data as AdCampaign[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // ---------------------------------------------------------------------------
  // Toggle pause / resume
  // ---------------------------------------------------------------------------
  const handleToggleStatus = async (campaign: AdCampaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    setTogglingId(campaign.id);
    try {
      const res = await fetch(`/api/ad-campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCampaigns(prev =>
          prev.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c)
        );
      }
    } catch {
      // silently ignore — user can refresh
    } finally {
      setTogglingId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived stats
  // ---------------------------------------------------------------------------
  const totalRevenue = campaigns.reduce((s, c) => s + (c.spent ?? 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions ?? 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks ?? 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  const filtered = campaigns.filter(c =>
    statusFilter === 'All' || c.status === statusFilter.toLowerCase()
  );

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Advertising Management</h1>
          <p className="text-gray-400 mt-1">Oversee all advertiser campaigns and revenue</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 animate-pulse">
              <div className="h-5 w-5 bg-slate-700 rounded mb-3" />
              <div className="h-7 w-16 bg-slate-700 rounded mb-2" />
              <div className="h-4 w-24 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden animate-pulse">
          <div className="p-4 space-y-3">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
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
      <div className="flex gap-2 flex-wrap">
        {['All', 'Active', 'Paused', 'Draft', 'Completed', 'Rejected'].map(f => (
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-600">
                    <Megaphone size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No campaigns found</p>
                  </td>
                </tr>
              )}
              {filtered.map(c => {
                const impressions = c.impressions ?? 0;
                const clicks = c.clicks ?? 0;
                const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0';
                const budget = c.budget ?? 0;
                const spent = c.spent ?? 0;
                const budgetPct = budget > 0 ? (spent / budget) * 100 : 0;
                const isToggling = togglingId === c.id;
                return (
                  <tr key={c.id} className="border-b border-slate-700/40 hover:bg-slate-700/20">
                    <td className="pl-6 pr-4 py-3">
                      <div className="font-medium text-gray-200">{c.businesses?.name ?? c.name}</div>
                      <div className="text-xs text-gray-500">
                        {[c.businesses?.city, c.businesses?.category].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-700 text-gray-300 px-2 py-0.5 rounded-full font-semibold">
                        {TYPE_LABELS[c.type] ?? c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">${budget.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="text-green-400 font-semibold">${spent.toFixed(2)}</div>
                      <div className="w-16 h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-300">{clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-300">{ctr}%</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[c.status] ?? 'bg-slate-700 text-gray-400'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="pl-4 pr-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-gray-400 hover:text-blue-400 p-1" title="Analytics">
                          <BarChart3 size={14} />
                        </button>
                        {c.status === 'active' && (
                          <button
                            onClick={() => handleToggleStatus(c)}
                            disabled={isToggling}
                            className="text-gray-400 hover:text-yellow-400 p-1 disabled:opacity-40"
                            title="Pause"
                          >
                            {isToggling
                              ? <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                              : <Pause size={14} />}
                          </button>
                        )}
                        {c.status === 'paused' && (
                          <button
                            onClick={() => handleToggleStatus(c)}
                            disabled={isToggling}
                            className="text-gray-400 hover:text-green-400 p-1 disabled:opacity-40"
                            title="Resume"
                          >
                            {isToggling
                              ? <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                              : <Play size={14} />}
                          </button>
                        )}
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
