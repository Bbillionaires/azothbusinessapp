'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { format } from 'date-fns';
import { ArrowLeft, ShieldCheck, MapPin, Phone, Globe, Star, Users, Mail, RefreshCw } from 'lucide-react';
import { BusinessStatusBadge } from '../../../../components/businesses/BusinessStatusBadge';

interface BusinessDetail {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  status: string;
  verification_level: string | null;
  is_local_owned: boolean;
  is_community_owned: boolean;
  is_veteran_owned: boolean;
  is_woman_owned: boolean;
  year_founded: number | null;
  average_rating: number | null;
  total_reviews: number;
  is_featured: boolean;
  created_at: string;
  owner_id: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

interface BizStats {
  followers: number;
  receipts_this_month: number;
  active_jobs: number;
  upcoming_events: number;
}

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [stats, setStats] = useState<BizStats>({ followers: 0, receipts_this_month: 0, active_jobs: 0, upcoming_events: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('businesses')
        .select('*, profiles!owner_id(full_name, email)')
        .eq('id', id)
        .single();
      if (data) setBusiness(data as BusinessDetail);

      const now = new Date().toISOString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [followRes, receiptRes, jobRes, eventRes] = await Promise.all([
        supabase.from('business_followers').select('id', { count: 'exact', head: true }).eq('business_id', id),
        supabase.from('receipts').select('id', { count: 'exact', head: true }).eq('business_id', id).gte('created_at', monthStart),
        supabase.from('job_postings').select('id', { count: 'exact', head: true }).eq('business_id', id).eq('is_active', true),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('business_id', id).eq('status', 'published').gte('start_at', now),
      ]);

      setStats({
        followers: followRes.count ?? 0,
        receipts_this_month: receiptRes.count ?? 0,
        active_jobs: jobRes.count ?? 0,
        upcoming_events: eventRes.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, [id]);

  const doAction = async (action: 'approve' | 'suspend' | 'feature' | 'unfeature') => {
    if (!business) return;
    setActionLoading(action);
    let update: Record<string, unknown> = {};
    if (action === 'approve') update = { status: 'active' };
    if (action === 'suspend') update = { status: 'suspended' };
    if (action === 'feature') update = { is_featured: true };
    if (action === 'unfeature') update = { is_featured: false };

    const { error } = await supabase.from('businesses').update(update).eq('id', id);
    if (!error) {
      setBusiness(prev => prev ? { ...prev, ...update } as BusinessDetail : null);
      setMsg(`${action.charAt(0).toUpperCase() + action.slice(1)} successful`);
      setTimeout(() => setMsg(null), 3000);
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Business not found.</p>
        <Link href="/businesses" className="text-green-400 underline mt-2 block">Back to Businesses</Link>
      </div>
    );
  }

  const ownershipBadges = [
    { active: business.is_local_owned, emoji: '🏠', label: 'Local Owned' },
    { active: business.is_community_owned, emoji: '🤝', label: 'Community Owned' },
    { active: business.is_veteran_owned, emoji: '🎖', label: 'Veteran Owned' },
    { active: business.is_woman_owned, emoji: '👩', label: 'Woman Owned' },
  ].filter(b => b.active);

  const yearsOld = business.year_founded ? new Date().getFullYear() - business.year_founded : null;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/businesses" className="text-gray-400 hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{business.name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">ID: {id}</p>
        </div>
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <BusinessStatusBadge status={business.status} />
          {msg && <span className="text-xs text-green-400 bg-green-900/40 px-3 py-1 rounded-full">{msg}</span>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Business info */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          <h2 className="font-bold text-gray-100">Business Information</h2>
          {business.description && <p className="text-sm text-gray-300 leading-relaxed">{business.description}</p>}
          <div className="space-y-2">
            {business.address && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={14} /> {business.address}{business.city ? `, ${business.city}` : ''}{business.state ? `, ${business.state}` : ''}
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={14} /> {business.phone}
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Globe size={14} /> {business.website}
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={14} /> {business.email}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {ownershipBadges.map((b, i) => (
              <span key={i} className="text-xs bg-green-900/40 text-green-400 px-2 py-1 rounded-full font-semibold">
                {b.emoji} {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Owner & account */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          <h2 className="font-bold text-gray-100">Owner & Account</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-gray-200">
              {(business.profiles?.full_name ?? 'B').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-gray-200">{business.profiles?.full_name ?? 'Unknown'}</p>
              <p className="text-sm text-gray-400">{business.profiles?.email ?? '—'}</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Category', value: business.category ?? '—' },
              { label: 'Founded', value: business.year_founded ? `${business.year_founded}${yearsOld ? ` (${yearsOld} yrs)` : ''}` : '—' },
              { label: 'Registered', value: format(new Date(business.created_at), 'MMM d, yyyy') },
              { label: 'Verification', value: business.verification_level ? `Greenwood ${business.verification_level.charAt(0).toUpperCase() + business.verification_level.slice(1)}™` : 'Unverified' },
              { label: 'Featured', value: business.is_featured ? '✓ Yes' : 'No' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="text-gray-300 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance stats */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Performance Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: <Star size={16} className="text-yellow-400" />, label: 'Avg Rating', value: business.average_rating?.toFixed(1) ?? '—' },
              { icon: <Star size={16} className="text-gray-400" />, label: 'Total Reviews', value: business.total_reviews },
              { icon: <Users size={16} className="text-blue-400" />, label: 'Followers', value: stats.followers },
              { icon: <ShieldCheck size={16} className="text-green-400" />, label: 'Receipts (mo)', value: stats.receipts_this_month },
              { icon: <ShieldCheck size={16} className="text-purple-400" />, label: 'Active Jobs', value: stats.active_jobs },
              { icon: <ShieldCheck size={16} className="text-orange-400" />, label: 'Upcoming Events', value: stats.upcoming_events },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                {s.icon}
                <div>
                  <div className="font-bold text-gray-200">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin actions */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Admin Actions</h2>
          <div className="space-y-2">
            {business.status !== 'active' && (
              <button
                onClick={() => doAction('approve')}
                disabled={actionLoading === 'approve'}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold bg-green-700/40 text-green-300 hover:bg-green-700/60 transition-colors disabled:opacity-60"
              >
                {actionLoading === 'approve' ? 'Processing...' : 'Approve / Activate Business'}
                <span className="block font-normal opacity-70 text-xs mt-0.5">Set status to active</span>
              </button>
            )}
            {business.is_featured ? (
              <button
                onClick={() => doAction('unfeature')}
                disabled={actionLoading === 'unfeature'}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold bg-yellow-700/40 text-yellow-300 hover:bg-yellow-700/60 transition-colors disabled:opacity-60"
              >
                {actionLoading === 'unfeature' ? 'Processing...' : 'Remove Featured Status'}
                <span className="block font-normal opacity-70 text-xs mt-0.5">Remove from featured listings</span>
              </button>
            ) : (
              <button
                onClick={() => doAction('feature')}
                disabled={actionLoading === 'feature'}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold bg-yellow-700/40 text-yellow-300 hover:bg-yellow-700/60 transition-colors disabled:opacity-60"
              >
                {actionLoading === 'feature' ? 'Processing...' : 'Feature This Business'}
                <span className="block font-normal opacity-70 text-xs mt-0.5">Boost in search results and home screen</span>
              </button>
            )}
            {business.status !== 'suspended' && (
              <button
                onClick={() => doAction('suspend')}
                disabled={actionLoading === 'suspend'}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold bg-red-700/40 text-red-300 hover:bg-red-700/60 transition-colors disabled:opacity-60"
              >
                {actionLoading === 'suspend' ? 'Processing...' : 'Suspend Business'}
                <span className="block font-normal opacity-70 text-xs mt-0.5">Temporarily remove from platform</span>
              </button>
            )}
            <Link
              href={`/users/${business.owner_id}`}
              className="block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold bg-slate-700 text-gray-300 hover:bg-slate-600 transition-colors"
            >
              View Owner Profile
              <span className="block font-normal opacity-70 text-xs mt-0.5">See the owner's user account</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
