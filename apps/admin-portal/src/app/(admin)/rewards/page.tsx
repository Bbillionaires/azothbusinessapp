'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Gift, Tag } from 'lucide-react';

const REWARD_TYPES = ['discount', 'gift_card', 'coupon', 'event_ticket', 'promotion', 'community'];

const MOCK_REWARDS = [
  { id: '1', name: '10% Off Any Local Purchase', type: 'discount', points_cost: 500, value: 10, quantity_available: 200, redeemed: 47, is_active: true, expires: '2024-06-30' },
  { id: '2', name: '$25 Local Business Gift Card', type: 'gift_card', points_cost: 2500, value: 25, quantity_available: 50, redeemed: 12, is_active: true, expires: '2024-12-31' },
  { id: '3', name: 'Community Event Free Ticket', type: 'event_ticket', points_cost: 750, value: 15, quantity_available: 100, redeemed: 33, is_active: true, expires: '2024-07-15' },
  { id: '4', name: 'Buy One Get One Coupon', type: 'coupon', points_cost: 300, value: 20, quantity_available: 0, redeemed: 300, is_active: false, expires: '2024-04-30' },
];

const TYPE_COLORS: Record<string, string> = {
  discount: 'bg-green-900/40 text-green-400',
  gift_card: 'bg-yellow-900/40 text-yellow-400',
  coupon: 'bg-blue-900/40 text-blue-400',
  event_ticket: 'bg-purple-900/40 text-purple-400',
  promotion: 'bg-orange-900/40 text-orange-400',
  community: 'bg-cyan-900/40 text-cyan-400',
};

export default function RewardsManagementPage() {
  const [creating, setCreating] = useState(false);
  const [newReward, setNewReward] = useState({ name: '', type: 'discount', points_cost: '', value: '', quantity: '', expires: '' });

  const totalActive = MOCK_REWARDS.filter(r => r.is_active).length;
  const totalRedeemed = MOCK_REWARDS.reduce((s, r) => s + r.redeemed, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Rewards Catalog</h1>
          <p className="text-gray-400 mt-1">Manage what users can redeem their points for</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
        >
          <Plus size={16} /> Add Reward
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Rewards', value: totalActive, icon: '🎁' },
          { label: 'Total Redeemed', value: totalRedeemed, icon: '✅' },
          { label: 'Points Spent', value: `${(totalRedeemed * 625 / 1000).toFixed(0)}k`, icon: '💰' },
          { label: 'Avg Cost', value: '625 pts', icon: '📊' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-100">{s.value}</div>
            <div className="text-sm text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-slate-800 rounded-xl border border-slate-600 p-5">
          <h2 className="font-bold text-gray-100 mb-4">Create New Reward</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Reward Name</label>
              <input
                value={newReward.name}
                onChange={e => setNewReward(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200"
                placeholder="e.g. 10% Off Local Purchase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
              <select
                value={newReward.type}
                onChange={e => setNewReward(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200"
              >
                {REWARD_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Points Cost</label>
              <input type="number" value={newReward.points_cost} onChange={e => setNewReward(p => ({ ...p, points_cost: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200" placeholder="500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Value ($)</label>
              <input type="number" value={newReward.value} onChange={e => setNewReward(p => ({ ...p, value: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200" placeholder="10" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Quantity Available</label>
              <input type="number" value={newReward.quantity} onChange={e => setNewReward(p => ({ ...p, quantity: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200" placeholder="100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Expires On</label>
              <input type="date" value={newReward.expires} onChange={e => setNewReward(p => ({ ...p, expires: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setCreating(false)} className="px-5 py-2 border border-slate-600 rounded-lg text-gray-400 hover:bg-slate-700 text-sm font-semibold">Cancel</button>
            <button className="px-5 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm font-semibold">Create Reward</button>
          </div>
        </div>
      )}

      {/* Rewards table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Reward', 'Type', 'Points Cost', 'Value', 'Quantity', 'Redeemed', 'Expires', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide first:pl-6 last:pr-6 last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_REWARDS.map(reward => (
                <tr key={reward.id} className="border-b border-slate-700/40 hover:bg-slate-700/20">
                  <td className="pl-6 pr-4 py-3">
                    <div className="flex items-center gap-2">
                      <Gift size={15} className="text-gray-500" />
                      <span className="font-medium text-gray-200">{reward.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${TYPE_COLORS[reward.type]}`}>
                      {reward.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-400">{reward.points_cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">${reward.value}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {reward.quantity_available === 0 ? (
                      <span className="text-red-400 font-semibold">Sold Out</span>
                    ) : reward.quantity_available}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{reward.redeemed}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{reward.expires}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${reward.is_active ? 'bg-green-900/40 text-green-400' : 'bg-slate-600 text-gray-400'}`}>
                      {reward.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="pl-4 pr-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-gray-400 hover:text-blue-400 p-1"><Edit2 size={14} /></button>
                      <button className="text-gray-400 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                    </div>
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
