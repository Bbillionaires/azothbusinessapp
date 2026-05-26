'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Receipt, Star, Users, Calendar, Shield } from 'lucide-react';

export default function UserDetailPage() {
  const { id } = useParams();

  const user = {
    id,
    name: 'Marcus Johnson',
    email: 'marcus@example.com',
    phone: '(904) 555-0199',
    tier: 'gold',
    role: 'consumer',
    points_balance: 4250,
    total_points_earned: 8900,
    referral_code: 'MARCUS2024',
    receipts: 47,
    reviews: 12,
    referrals: 8,
    events_attended: 5,
    is_legend: false,
    status: 'active',
    joined: '2023-02-14',
    last_active: '2024-05-25',
    ip_address: '192.168.x.x',
    fraud_flag_count: 0,
  };

  const recentActivity = [
    { type: 'receipt', desc: 'Receipt submitted — Greenwood Coffee ($24.50)', date: '2024-05-25', points: 24 },
    { type: 'review', desc: 'Left 5-star review for LaVilla Hair Studio', date: '2024-05-22', points: 10 },
    { type: 'referral', desc: 'Referred new user: aaliyah_b', date: '2024-05-20', points: 100 },
    { type: 'event', desc: 'RSVP\'d for Downtown Vendor Market', date: '2024-05-18', points: 0 },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users" className="text-gray-400 hover:text-gray-200"><ArrowLeft size={20} /></Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-gray-200 text-lg">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">{user.name}</h1>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>
        <span className="ml-auto text-xs bg-yellow-900/40 text-yellow-400 px-3 py-1 rounded-full font-bold uppercase">
          {user.tier}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Account details */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Account Details</h2>
          <div className="space-y-2">
            {[
              { label: 'User ID', value: String(user.id) },
              { label: 'Phone', value: user.phone },
              { label: 'Role', value: user.role },
              { label: 'Status', value: user.status },
              { label: 'Joined', value: user.joined },
              { label: 'Last Active', value: user.last_active },
              { label: 'Referral Code', value: user.referral_code },
            ].map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="text-gray-300 font-medium">{item.value}</span>
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
              { icon: <Receipt size={16} className="text-blue-400" />, label: 'Receipts', value: user.receipts },
              { icon: <Star size={16} className="text-yellow-400" />, label: 'Reviews', value: user.reviews },
              { icon: <Users size={16} className="text-purple-400" />, label: 'Referrals', value: user.referrals },
              { icon: <Calendar size={16} className="text-cyan-400" />, label: 'Events', value: user.events_attended },
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

        {/* Recent activity */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-lg flex-shrink-0">
                  {a.type === 'receipt' ? '🧾' : a.type === 'review' ? '⭐' : a.type === 'referral' ? '👥' : '📅'}
                </span>
                <div className="flex-1">
                  <p className="text-gray-300">{a.desc}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.date}</p>
                </div>
                {a.points > 0 && (
                  <span className="text-xs text-green-400 font-semibold">+{a.points}pts</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Admin actions */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Admin Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Adjust Points', desc: 'Add or remove points manually', color: 'bg-blue-700/40 text-blue-300 hover:bg-blue-700/60' },
              { label: 'Promote to Legend Tier', desc: 'Manually grant Community Legend status', color: 'bg-purple-700/40 text-purple-300 hover:bg-purple-700/60' },
              { label: 'Reset Fraud Flags', desc: 'Clear fraud flags on this account', color: 'bg-yellow-700/40 text-yellow-300 hover:bg-yellow-700/60' },
              { label: 'Suspend Account', desc: 'Prevent login and activity', color: 'bg-red-700/40 text-red-300 hover:bg-red-700/60' },
            ].map((action, i) => (
              <button key={i} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${action.color}`}>
                {action.label}
                <span className="block font-normal opacity-70 text-xs mt-0.5">{action.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
