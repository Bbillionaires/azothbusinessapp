'use client';

import { useState } from 'react';
import { Share2, DollarSign, Users, TrendingUp, Plus, Edit2, Trash2 } from 'lucide-react';

const REFERRAL_TYPES = [
  { value: 'percentage', label: 'Percentage of Sale' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'pay_per_lead', label: 'Pay Per Lead' },
  { value: 'pay_per_appointment', label: 'Pay Per Appointment' },
  { value: 'pay_per_sale', label: 'Pay Per Sale' },
  { value: 'affiliate', label: 'Affiliate Program' },
  { value: 'commission', label: 'Commission Based' },
];

const QUICK_AMOUNTS = {
  percentage: [5, 10, 15, 20, 25],
  fixed: [10, 25, 50, 100, 250, 500],
};

const MOCK_ACTIVE_REFERRALS = [
  { id: '1', user: 'Marcus Johnson', date: '2024-05-14', type: 'sale', amount: 85, status: 'completed', commission: 8.50 },
  { id: '2', user: 'Aaliyah Williams', date: '2024-05-12', type: 'lead', amount: 0, status: 'pending', commission: 15.00 },
  { id: '3', user: 'Jerome Davis', date: '2024-05-10', type: 'sale', amount: 120, status: 'completed', commission: 12.00 },
];

export default function ReferralsPage() {
  const [programType, setProgramType] = useState<'percentage' | 'fixed'>('percentage');
  const [rate, setRate] = useState<number | ''>('');
  const [marketplaceEnabled, setMarketplaceEnabled] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const totalEarned = MOCK_ACTIVE_REFERRALS
    .filter(r => r.status === 'completed')
    .reduce((s, r) => s + r.commission, 0);
  const pendingCount = MOCK_ACTIVE_REFERRALS.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-gray-500 mt-1">Set up a referral program and let your customers earn while promoting your business</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Users size={20} className="text-blue-600" />, label: 'Active Referrers', value: '47', bg: 'bg-blue-50' },
          { icon: <TrendingUp size={20} className="text-green-600" />, label: 'Total Referrals', value: '124', bg: 'bg-green-50' },
          { icon: <DollarSign size={20} className="text-yellow-600" />, label: 'Commissions Paid', value: `$${totalEarned.toFixed(2)}`, bg: 'bg-yellow-50' },
          { icon: <Share2 size={20} className="text-purple-600" />, label: 'Pending', value: String(pendingCount), bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Program setup */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900">Your Referral Program</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-1 text-sm text-green-800 font-semibold hover:text-green-600"
          >
            <Edit2 size={14} /> {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editMode ? (
          <div className="space-y-4">
            {/* Program type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Program Type</label>
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

            {/* Quick select */}
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
                <button className="px-4 py-2 rounded-lg text-sm font-semibold border border-dashed border-gray-300 text-gray-500 hover:border-green-800">
                  Custom
                </button>
              </div>
              <input
                type="number"
                value={rate}
                onChange={e => setRate(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500"
                placeholder={programType === 'percentage' ? 'Enter percentage...' : 'Enter fixed amount...'}
              />
            </div>

            <button className="w-full bg-green-800 text-white rounded-xl py-3 font-bold hover:bg-green-700">
              Save Program Settings
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-6 p-4 bg-green-50 rounded-xl">
            <div className="text-4xl font-extrabold text-green-800">
              {rate ? (programType === 'percentage' ? `${rate}%` : `$${rate}`) : 'Not Set'}
            </div>
            <div>
              <div className="font-semibold text-green-900">
                {programType === 'percentage' ? 'Percentage Referral Program' : 'Fixed Amount Referral Program'}
              </div>
              <div className="text-sm text-green-700 mt-0.5">
                {rate
                  ? `Referrers earn ${programType === 'percentage' ? `${rate}%` : `$${rate}`} for each qualified referral`
                  : 'Set your referral rate to activate the program'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Referral Marketplace */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Referral Marketplace™</h2>
            <p className="text-sm text-gray-500 mt-0.5">Post your referral opportunity to thousands of Local First Rewards users</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Active</span>
            <button
              onClick={() => setMarketplaceEnabled(!marketplaceEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${marketplaceEnabled ? 'bg-green-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${marketplaceEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {[
            { type: 'Pay Per Lead', icon: '🎯', desc: 'Pay for each qualified lead sent your way' },
            { type: 'Pay Per Appointment', icon: '📅', desc: 'Pay when a referral books an appointment' },
            { type: 'Pay Per Sale', icon: '💰', desc: 'Pay a commission on completed sales' },
            { type: 'Affiliate Program', icon: '🤝', desc: 'Ongoing affiliate partnerships' },
            { type: 'Commission Based', icon: '📊', desc: 'Custom commission structures' },
          ].map((opt, i) => (
            <div key={i} className={`border rounded-xl p-4 cursor-pointer transition-colors ${marketplaceEnabled ? 'border-green-200 bg-green-50' : 'border-gray-100 opacity-60'}`}>
              <div className="text-xl mb-1">{opt.icon}</div>
              <div className="font-semibold text-sm text-gray-900">{opt.type}</div>
              <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent referral activity */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 font-semibold text-gray-600">Referrer</th>
                <th className="text-left py-2 font-semibold text-gray-600">Date</th>
                <th className="text-left py-2 font-semibold text-gray-600">Type</th>
                <th className="text-right py-2 font-semibold text-gray-600">Sale Amount</th>
                <th className="text-right py-2 font-semibold text-gray-600">Commission</th>
                <th className="text-right py-2 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ACTIVE_REFERRALS.map(ref => (
                <tr key={ref.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{ref.user}</td>
                  <td className="py-3 text-gray-500">{ref.date}</td>
                  <td className="py-3">
                    <span className="capitalize px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {ref.type}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-700">{ref.amount ? `$${ref.amount}` : '—'}</td>
                  <td className="py-3 text-right font-semibold text-green-700">${ref.commission.toFixed(2)}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      ref.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ref.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
