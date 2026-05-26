'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { format } from 'date-fns';
import { ArrowLeft, Receipt, Star, Users, Calendar, Shield, RefreshCw } from 'lucide-react';

interface UserDetail {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  tier: string;
  role: string;
  points_balance: number;
  total_points_earned: number;
  referral_code: string | null;
  status: string;
  created_at: string;
  last_sign_in_at?: string;
  avatar_url: string | null;
}

interface UserStats {
  receipts: number;
  reviews: number;
  referrals: number;
  events: number;
  fraud_flags: number;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  created_at: string;
  points?: number;
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-orange-900/40 text-orange-400',
  silver: 'bg-slate-700 text-slate-300',
  gold: 'bg-yellow-900/40 text-yellow-400',
  platinum: 'bg-blue-900/40 text-blue-400',
  legend: 'bg-purple-900/40 text-purple-400',
  hall_of_legends: 'bg-gradient-to-r from-yellow-900/40 to-purple-900/40 text-yellow-300',
};

export default function UserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<UserStats>({ receipts: 0, reviews: 0, referrals: 0, events: 0, fraud_flags: 0 });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id as string)
        .single();
      if (profile) setUser(profile as UserDetail);

      const [receiptRes, reviewRes, referralRes, eventRes, fraudRes] = await Promise.all([
        supabase.from('receipts').select('id', { count: 'exact', head: true }).eq('user_id', id as string),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', id as string),
        supabase.from('referral_events').select('id', { count: 'exact', head: true }).eq('referrer_id', id as string),
        supabase.from('event_rsvps').select('id', { count: 'exact', head: true }).eq('user_id', id as string),
        supabase.from('receipts').select('id', { count: 'exact', head: true }).eq('user_id', id as string).gte('fraud_score', 90),
      ]);

      setStats({
        receipts: receiptRes.count ?? 0,
        reviews: reviewRes.count ?? 0,
        referrals: referralRes.count ?? 0,
        events: eventRes.count ?? 0,
        fraud_flags: fraudRes.count ?? 0,
      });

      // Load recent points transactions as activity
      const { data: txns } = await supabase
        .from('points_transactions')
        .select('id, type, amount, description, created_at')
        .eq('user_id', id as string)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txns) {
        setActivity(txns.map(t => ({
          id: t.id,
          type: t.type,
          description: t.description ?? t.type,
          created_at: t.created_at,
          points: t.amount,
        })));
      }

      setLoading(false);
    }
    load();
  }, [id]);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const doAction = async (action: string) => {
    setActionLoading(action);
    if (action === 'suspend') {
      const { error } = await supabase.from('profiles').update({ status: 'suspended' }).eq('id', id as string);
      if (!error) { setUser(prev => prev ? { ...prev, status: 'suspended' } : null); showMsg('Account suspended'); }
      else showMsg('Failed: ' + error.message, 'error');
    } else if (action === 'activate') {
      const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', id as string);
      if (!error) { setUser(prev => prev ? { ...prev, status: 'active' } : null); showMsg('Account activated'); }
      else showMsg('Failed: ' + error.message, 'error');
    } else if (action === 'clear_fraud') {
      const { error } = await supabase.from('receipts').update({ fraud_score: 0, status: 'pending' }).eq('user_id', id as string).gte('fraud_score', 90).in('status', ['pending', 'flagged']);
      if (!error) showMsg('Fraud flags cleared');
      else showMsg('Failed: ' + error.message, 'error');
    } else if (action === 'adjust_points') {
      const amount = parseInt(adjustPoints);
      if (!amount || !adjustReason) { showMsg('Enter amount and reason', 'error'); setActionLoading(null); return; }
      const { error } = await supabase.rpc('award_points', {
        p_user_id: id as string,
        p_amount: amount,
        p_type: 'adjustment',
        p_description: `Admin adjustment: ${adjustReason}`,
        p_reference_type: 'admin',
      });
      if (!error) {
        setUser(prev => prev ? { ...prev, points_balance: Math.max(0, prev.points_balance + amount) } : null);
        setAdjustPoints('');
        setAdjustReason('');
        showMsg(`Points ${amount > 0 ? 'added' : 'removed'} successfully`);
      } else showMsg('Failed: ' + error.message, 'error');
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

  if (!user) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>User not found.</p>
        <Link href="/users" className="text-green-400 underline mt-2 block">Back to Users</Link>
      </div>
    );
  }

  const initials = (user.full_name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2);
  const tierColor = TIER_COLORS[user.tier] ?? 'bg-slate-700 text-slate-300';

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/users" className="text-gray-400 hover:text-gray-200"><ArrowLeft size={20} /></Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-gray-200 text-lg">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">{user.full_name ?? 'Unknown'}</h1>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${tierColor}`}>{user.tier}</span>
          {user.status === 'suspended' && (
            <span className="text-xs bg-red-900/40 text-red-400 px-3 py-1 rounded-full font-bold">SUSPENDED</span>
          )}
          {msg && (
            <span className={`text-xs px-3 py-1 rounded-full ${msg.type === 'success' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
              {msg.text}
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Account details */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Account Details</h2>
          <div className="space-y-2">
            {[
              { label: 'User ID', value: String(user.id) },
              { label: 'Phone', value: user.phone ?? '—' },
              { label: 'Role', value: user.role },
              { label: 'Status', value: user.status },
              { label: 'Joined', value: format(new Date(user.created_at), 'MMM d, yyyy') },
              { label: 'Referral Code', value: user.referral_code ?? '—' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="text-gray-300 font-medium truncate ml-4 max-w-[180px] text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Points & stats */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Points & Activity</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: <Shield size={16} className="text-green-400" />, label: 'Balance', value: user.points_balance.toLocaleString() },
              { icon: <Shield size={16} className="text-yellow-400" />, label: 'Total Earned', value: user.total_points_earned.toLocaleString() },
              { icon: <Receipt size={16} className="text-blue-400" />, label: 'Receipts', value: stats.receipts },
              { icon: <Star size={16} className="text-yellow-400" />, label: 'Reviews', value: stats.reviews },
              { icon: <Users size={16} className="text-purple-400" />, label: 'Referrals', value: stats.referrals },
              { icon: <Calendar size={16} className="text-cyan-400" />, label: 'Events RSVPd', value: stats.events },
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
          {stats.fraud_flags > 0 && (
            <div className="mt-3 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 text-xs text-red-400">
              ⚠ {stats.fraud_flags} receipt{stats.fraud_flags > 1 ? 's' : ''} flagged for fraud
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Recent Points Activity</h2>
          {activity.length === 0 ? (
            <p className="text-gray-500 text-sm">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.map(a => (
                <div key={a.id} className="flex items-start gap-2 text-sm">
                  <span className="text-lg flex-shrink-0">
                    {a.type === 'earned' ? '🧾' : a.type === 'spent' ? '🎁' : a.type === 'adjustment' ? '⚙️' : a.type === 'referral' ? '👥' : a.type === 'bonus' ? '⭐' : '📋'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 truncate">{a.description}</p>
                    <p className="text-xs text-gray-500">{format(new Date(a.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  {a.points != null && (
                    <span className={`text-xs font-semibold flex-shrink-0 ${a.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {a.points >= 0 ? '+' : ''}{a.points}pts
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin actions */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          <h2 className="font-bold text-gray-100">Admin Actions</h2>

          {/* Points adjustment */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase">Adjust Points</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="±points"
                value={adjustPoints}
                onChange={e => setAdjustPoints(e.target.value)}
                className="w-24 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-gray-200 focus:ring-1 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Reason"
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-gray-200 focus:ring-1 focus:ring-green-500"
              />
              <button
                onClick={() => doAction('adjust_points')}
                disabled={actionLoading === 'adjust_points'}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-60"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {user.status !== 'suspended' ? (
              <button
                onClick={() => doAction('suspend')}
                disabled={actionLoading === 'suspend'}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold bg-red-700/40 text-red-300 hover:bg-red-700/60 transition-colors disabled:opacity-60"
              >
                {actionLoading === 'suspend' ? 'Processing...' : 'Suspend Account'}
                <span className="block font-normal opacity-70 text-xs mt-0.5">Prevent login and activity</span>
              </button>
            ) : (
              <button
                onClick={() => doAction('activate')}
                disabled={actionLoading === 'activate'}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold bg-green-700/40 text-green-300 hover:bg-green-700/60 transition-colors disabled:opacity-60"
              >
                {actionLoading === 'activate' ? 'Processing...' : 'Reactivate Account'}
                <span className="block font-normal opacity-70 text-xs mt-0.5">Restore full access</span>
              </button>
            )}
            {stats.fraud_flags > 0 && (
              <button
                onClick={() => doAction('clear_fraud')}
                disabled={actionLoading === 'clear_fraud'}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold bg-yellow-700/40 text-yellow-300 hover:bg-yellow-700/60 transition-colors disabled:opacity-60"
              >
                {actionLoading === 'clear_fraud' ? 'Processing...' : 'Clear Fraud Flags'}
                <span className="block font-normal opacity-70 text-xs mt-0.5">Reset flagged receipts for review</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
