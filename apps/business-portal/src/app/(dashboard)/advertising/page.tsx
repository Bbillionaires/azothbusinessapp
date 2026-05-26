'use client';

import { useState, useEffect } from 'react';
import { Megaphone, BarChart3, Play, Pause, Plus, Eye, MousePointer, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const AD_TYPES = [
  {
    id: 'sponsored_listing',
    name: 'Sponsored Listing',
    icon: '📌',
    desc: 'Your business appears at the top of search results in your category',
    price: 49,
    period: 'month',
    features: ['Top of category results', 'Sponsored label', 'Priority placement on map'],
  },
  {
    id: 'banner',
    name: 'Banner Ad',
    icon: '🖼️',
    desc: 'Full-width banner displayed to users browsing near your location',
    price: 99,
    period: 'month',
    features: ['Geo-targeted display', 'Custom banner image', 'Link to your profile or offer'],
  },
  {
    id: 'push_notification',
    name: 'Push Notification',
    icon: '🔔',
    desc: 'Send a targeted push notification to nearby app users',
    price: 29,
    period: 'send',
    features: ['Reach nearby app users', 'Custom message', 'One-time delivery blast'],
  },
];

const TYPE_LABELS: Record<string, string> = {
  sponsored_listing: 'Sponsored Listing',
  banner: 'Banner Ad',
  push_notification: 'Push Notification',
};

interface Campaign {
  id: string;
  name: string;
  type: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  status: string;
  start_at: string;
  end_at: string | null;
}

export default function AdvertisingPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      if (!biz) { setLoading(false); return; }
      setBusinessId(biz.id);

      const { data } = await supabase
        .from('ad_campaigns')
        .select('id, name, type, budget, spent, impressions, clicks, status, start_at, end_at')
        .eq('business_id', biz.id)
        .order('created_at', { ascending: false });
      setCampaigns(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleCampaign(id: string, current: string) {
    const newStatus = current === 'active' ? 'paused' : 'active';
    setToggling(id);
    await supabase.from('ad_campaigns').update({ status: newStatus }).eq('id', id);
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    setToggling(null);
  }

  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advertising</h1>
          <p className="text-gray-500 mt-1">Reach more local customers with targeted ads</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700"
        >
          <Plus size={18} /> New Campaign
        </button>
      </div>

      {/* Performance overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Impressions', value: loading ? '—' : totalImpressions.toLocaleString(), icon: <Eye size={18} className="text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Total Clicks', value: loading ? '—' : totalClicks.toLocaleString(), icon: <MousePointer size={18} className="text-green-600" />, bg: 'bg-green-50' },
          { label: 'Avg CTR', value: loading ? '—' : `${avgCtr}%`, icon: <BarChart3 size={18} className="text-yellow-600" />, bg: 'bg-yellow-50' },
          { label: 'Total Spent', value: loading ? '—' : `$${totalSpent.toFixed(2)}`, icon: <Megaphone size={18} className="text-purple-600" />, bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
              {stat.icon}
            </div>
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Create campaign panel */}
      {creating && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Create New Campaign</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {AD_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`border-2 rounded-xl p-5 text-left transition-all ${
                  selectedType === type.id ? 'border-green-800 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">{type.icon}</div>
                <h3 className="font-bold text-gray-900">{type.name}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-snug">{type.desc}</p>
                <div className="mt-3 font-bold text-green-800">
                  ${type.price}<span className="text-sm font-normal text-gray-500">/{type.period}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {type.features.map((f, fi) => (
                    <li key={fi} className="text-xs text-gray-600 flex items-center gap-1">
                      <span className="text-green-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setCreating(false); setSelectedType(null); }}
              className="px-6 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold"
            >
              Cancel
            </button>
            <button
              disabled={!selectedType}
              className="px-6 py-2 bg-green-800 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-40"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-900">Campaigns</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Megaphone size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No campaigns yet</p>
            <p className="text-sm mt-1 text-gray-400">Create your first campaign to start reaching more customers.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {campaigns.map(campaign => {
              const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(1) : '0.0';
              const budgetUsed = campaign.budget > 0 ? Math.min(100, (campaign.spent / campaign.budget) * 100) : 0;
              return (
                <div key={campaign.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900">{campaign.name}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                          {TYPE_LABELS[campaign.type] ?? campaign.type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                          campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                          campaign.status === 'draft' ? 'bg-gray-100 text-gray-500' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(campaign.start_at).toLocaleDateString()}
                        {campaign.end_at ? ` – ${new Date(campaign.end_at).toLocaleDateString()}` : ' (ongoing)'}
                      </p>

                      <div className="flex gap-6 mt-3">
                        <div>
                          <div className="text-xs text-gray-500">Impressions</div>
                          <div className="font-bold text-gray-900">{campaign.impressions.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Clicks</div>
                          <div className="font-bold text-gray-900">{campaign.clicks.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">CTR</div>
                          <div className="font-bold text-gray-900">{ctr}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Spent / Budget</div>
                          <div className="font-bold text-gray-900">${campaign.spent.toFixed(2)} / ${campaign.budget}</div>
                        </div>
                      </div>

                      <div className="mt-3 max-w-xs">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-600 rounded-full" style={{ width: `${budgetUsed}%` }} />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{budgetUsed.toFixed(0)}% of budget used</div>
                      </div>
                    </div>

                    {(campaign.status === 'active' || campaign.status === 'paused') && (
                      <button
                        onClick={() => toggleCampaign(campaign.id, campaign.status)}
                        disabled={toggling === campaign.id}
                        className="flex items-center gap-1 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {toggling === campaign.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : campaign.status === 'active' ? (
                          <><Pause size={14} /> Pause</>
                        ) : (
                          <><Play size={14} /> Resume</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
