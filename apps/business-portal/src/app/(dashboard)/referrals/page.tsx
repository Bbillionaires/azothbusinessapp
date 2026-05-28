'use client';

import { useState, useEffect } from 'react';
import { Share2, DollarSign, Users, TrendingUp, Edit2, Loader2, Copy, Check } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface ReferralLink {
  id: string;
  code: string;
  clicks: number;
  conversions: number;
  earnings: number;
}

interface ReferralEvent {
  id: string;
  type: string;
  amount: number | null;
  points_awarded: number;
  cash_awarded: number;
  status: string;
  created_at: string;
  referred: { full_name: string | null; email: string | null } | null;
}

interface MarketplaceListing {
  id: string;
  title: string;
  description: string | null;
  type: string;
  rate: number;
  rate_type: string;
  is_active: boolean;
  max_budget: number | null;
  spent: number;
}

const QUICK_AMOUNTS = {
  percentage: [5, 10, 15, 20, 25],
  fixed: [10, 25, 50, 100, 250, 500],
};

export default function ReferralsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<ReferralLink | null>(null);
  const [events, setEvents] = useState<ReferralEvent[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [copied, setCopied] = useState(false);

  // Program setup form
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [programType, setProgramType] = useState<'percentage' | 'fixed'>('percentage');
  const [rate, setRate] = useState<number | ''>('');
  const [marketplaceType, setMarketplaceType] = useState<string>('pay_per_sale');
  const [title, setTitle] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [bizResult, linkResult, eventsResult] = await Promise.all([
        supabase.from('businesses').select('id').eq('owner_id', user.id).eq('status', 'active').limit(1).maybeSingle(),
        supabase.from('referral_links').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('referral_events')
          .select('*, referred:referred_id(full_name, email)')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      const biz = bizResult.data;
      setBusinessId(biz?.id ?? null);
      setReferralLink(linkResult.data);
      setEvents((eventsResult.data ?? []) as ReferralEvent[]);

      if (biz?.id) {
        const { data: listingsData } = await supabase
          .from('referral_marketplace')
          .select('*')
          .eq('business_id', biz.id)
          .order('created_at', { ascending: false });
        setListings(listingsData ?? []);

        // Pre-fill form from first active listing
        const active = listingsData?.find(l => l.is_active);
        if (active) {
          setRate(active.rate);
          setProgramType(active.rate_type as 'percentage' | 'fixed');
          setMarketplaceType(active.type);
          setTitle(active.title);
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  async function saveProgram() {
    if (!businessId || !rate || !title) return;
    setSaving(true);
    const payload = {
      business_id: businessId,
      title: title || `${rate}${programType === 'percentage' ? '%' : '$'} ${marketplaceType.replace(/_/g, ' ')} program`,
      type: marketplaceType,
      rate: Number(rate),
      rate_type: programType,
      is_active: true,
    };

    const existing = listings.find(l => l.is_active);
    if (existing) {
      const { data } = await supabase.from('referral_marketplace').update(payload).eq('id', existing.id).select().single();
      if (data) setListings(prev => prev.map(l => l.id === existing.id ? data : l));
    } else {
      const { data } = await supabase.from('referral_marketplace').insert(payload).select().single();
      if (data) setListings(prev => [data, ...prev]);
    }

    setSaving(false);
    setEditMode(false);
  }

  async function toggleListing(id: string, current: boolean) {
    await supabase.from('referral_marketplace').update({ is_active: !current }).eq('id', id);
    setListings(prev => prev.map(l => l.id === id ? { ...l, is_active: !current } : l));
  }

  function copyReferralLink() {
    if (!referralLink) return;
    const url = `${window.location.origin}/r/${referralLink.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalEarned = events.filter(e => e.status === 'completed').reduce((s, e) => s + (e.cash_awarded ?? 0), 0);
  const pendingCount = events.filter(e => e.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-gray-500 mt-1">Set up a referral program and let your customers earn while promoting your business</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Users size={20} className="text-blue-600" />, label: 'Total Referrals', value: referralLink ? String(referralLink.conversions) : '0', bg: 'bg-blue-50' },
          { icon: <TrendingUp size={20} className="text-green-600" />, label: 'Link Clicks', value: referralLink ? String(referralLink.clicks) : '0', bg: 'bg-green-50' },
          { icon: <DollarSign size={20} className="text-yellow-600" />, label: 'Commissions Paid', value: `$${totalEarned.toFixed(2)}`, bg: 'bg-yellow-50' },
          { icon: <Share2 size={20} className="text-purple-600" />, label: 'Pending', value: String(pendingCount), bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            {loading ? (
              <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mb-2" />
            ) : (
              <>
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Referral link */}
      {referralLink && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-lg text-gray-900 mb-3">Your Referral Link</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 font-mono truncate">
              {typeof window !== 'undefined' ? `${window.location.origin}/r/${referralLink.code}` : `/r/${referralLink.code}`}
            </div>
            <button
              onClick={copyReferralLink}
              className="flex items-center gap-2 px-4 py-3 bg-green-800 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Program setup */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900">Your Referral Program</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-1 text-sm text-green-800 font-semibold hover:text-green-600"
          >
            <Edit2 size={14} /> {editMode ? 'Cancel' : listings.length > 0 ? 'Edit' : 'Set Up'}
          </button>
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. 10% Commission on All Sales"
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'percentage', label: 'Percentage', icon: '%', desc: 'Earn % of each sale' },
                  { id: 'fixed', label: 'Fixed Amount', icon: '$', desc: 'Earn a fixed amount' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setProgramType(opt.id as any)}
                    className={`border-2 rounded-xl p-4 text-left transition-colors ${
                      programType === opt.id ? 'border-green-800 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl font-bold text-gray-900">{opt.icon}</div>
                    <div className="font-semibold text-gray-900 mt-1">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate {programType === 'percentage' ? '(%)' : '($)'}
              </label>
              <div className="flex gap-2 flex-wrap mb-3">
                {(QUICK_AMOUNTS[programType] ?? []).map(amount => (
                  <button
                    key={amount}
                    onClick={() => setRate(amount)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      rate === amount ? 'bg-green-800 text-white border-green-800' : 'border-gray-200 hover:border-green-800 text-gray-700'
                    }`}
                  >
                    {programType === 'percentage' ? `${amount}%` : `$${amount}`}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={rate}
                onChange={e => setRate(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500"
                placeholder={programType === 'percentage' ? 'Enter percentage...' : 'Enter fixed amount...'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Program Type</label>
              <select
                value={marketplaceType}
                onChange={e => setMarketplaceType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500"
              >
                <option value="pay_per_sale">Pay Per Sale</option>
                <option value="pay_per_lead">Pay Per Lead</option>
                <option value="pay_per_appointment">Pay Per Appointment</option>
                <option value="affiliate">Affiliate Program</option>
                <option value="commission">Commission Based</option>
              </select>
            </div>

            <button
              onClick={saveProgram}
              disabled={saving || !rate || !title}
              className="w-full bg-green-800 text-white rounded-xl py-3 font-bold hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
              Save Program Settings
            </button>
          </div>
        ) : listings.length > 0 ? (
          <div className="space-y-3">
            {listings.map(listing => (
              <div key={listing.id} className="flex items-center gap-6 p-4 bg-green-50 rounded-xl">
                <div className="text-4xl font-extrabold text-green-800">
                  {listing.rate_type === 'percentage' ? `${listing.rate}%` : `$${listing.rate}`}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-green-900">{listing.title}</div>
                  <div className="text-sm text-green-700 capitalize mt-0.5">{listing.type.replace(/_/g, ' ')}</div>
                </div>
                <button
                  onClick={() => toggleListing(listing.id, listing.is_active)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${listing.is_active ? 'bg-green-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${listing.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Share2 size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No referral program yet</p>
            <p className="text-sm mt-1">Set up a program to let your customers earn by referring friends.</p>
          </div>
        )}
      </div>

      {/* Referral Marketplace */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="mb-4">
          <h2 className="font-bold text-lg text-gray-900">Referral Marketplace™</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your active programs appear here for users to discover and apply</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { type: 'pay_per_lead', icon: '🎯', desc: 'Pay for each qualified lead sent your way' },
            { type: 'pay_per_appointment', icon: '📅', desc: 'Pay when a referral books an appointment' },
            { type: 'pay_per_sale', icon: '💰', desc: 'Pay a commission on completed sales' },
            { type: 'affiliate', icon: '🤝', desc: 'Ongoing affiliate partnerships' },
            { type: 'commission', icon: '📊', desc: 'Custom commission structures' },
          ].map((opt) => {
            const active = listings.some(l => l.type === opt.type && l.is_active);
            return (
              <div key={opt.type} className={`border rounded-xl p-4 transition-colors ${active ? 'border-green-200 bg-green-50' : 'border-gray-100 opacity-60'}`}>
                <div className="text-xl mb-1">{opt.icon}</div>
                <div className="font-semibold text-sm text-gray-900 capitalize">{opt.type.replace(/_/g, ' ')}</div>
                <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                {active && <span className="inline-block mt-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Active</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-4">Recent Activity</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No referral activity yet. Share your referral link to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 font-semibold text-gray-600">Referred User</th>
                  <th className="text-left py-2 font-semibold text-gray-600">Date</th>
                  <th className="text-left py-2 font-semibold text-gray-600">Type</th>
                  <th className="text-right py-2 font-semibold text-gray-600">Points</th>
                  <th className="text-right py-2 font-semibold text-gray-600">Cash</th>
                  <th className="text-right py-2 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">
                      {event.referred?.full_name ?? event.referred?.email ?? 'Anonymous'}
                    </td>
                    <td className="py-3 text-gray-500">{new Date(event.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className="capitalize px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {event.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-700">+{event.points_awarded}</td>
                    <td className="py-3 text-right font-semibold text-green-700">
                      {event.cash_awarded > 0 ? `$${event.cash_awarded.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        event.status === 'completed' ? 'bg-green-100 text-green-700' :
                        event.status === 'expired' ? 'bg-gray-100 text-gray-500' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {event.status}
                      </span>
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
