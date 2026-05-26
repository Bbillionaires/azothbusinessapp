'use client';

import { useState } from 'react';
import { Settings, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { RoleGuard } from '../../../components/layout/RoleGuard';

const SECTIONS = [
  {
    title: 'Points Configuration',
    desc: 'Configure how points are earned and spent',
    fields: [
      { key: 'points_per_dollar', label: 'Points per Dollar Spent', type: 'number', value: '1', hint: '1 point = $1' },
      { key: 'receipt_daily_cap', label: 'Daily Points Cap (per user)', type: 'number', value: '500' },
      { key: 'review_points', label: 'Points per Review', type: 'number', value: '10' },
      { key: 'event_points', label: 'Points per Event Attended', type: 'number', value: '25' },
      { key: 'referral_user_points', label: 'Points for Referring a User', type: 'number', value: '100' },
      { key: 'referral_business_points', label: 'Points for Referring a Business', type: 'number', value: '500' },
    ],
  },
  {
    title: 'Tier Thresholds',
    desc: 'Minimum points required for each tier',
    fields: [
      { key: 'tier_bronze_min', label: 'Bronze Minimum', type: 'number', value: '0' },
      { key: 'tier_silver_min', label: 'Silver Minimum', type: 'number', value: '1000' },
      { key: 'tier_gold_min', label: 'Gold Minimum', type: 'number', value: '5000' },
      { key: 'tier_platinum_min', label: 'Platinum Minimum', type: 'number', value: '20000' },
      { key: 'tier_legend_min', label: 'Legend Minimum', type: 'number', value: '100000' },
    ],
  },
  {
    title: 'Business Verification Pricing',
    desc: 'Monthly pricing for Greenwood Check tiers',
    fields: [
      { key: 'price_basic', label: 'Greenwood Basic™ ($/month)', type: 'number', value: '9.99' },
      { key: 'price_pro', label: 'Greenwood Pro™ ($/month)', type: 'number', value: '29.99' },
      { key: 'price_elite', label: 'Greenwood Elite™ ($/month)', type: 'number', value: '79.99' },
    ],
  },
  {
    title: 'Fraud Detection',
    desc: 'Configure fraud scoring thresholds',
    fields: [
      { key: 'fraud_auto_reject_score', label: 'Auto-Reject Score Threshold', type: 'number', value: '90', hint: 'Receipts with score ≥ this are auto-rejected' },
      { key: 'fraud_review_score', label: 'Manual Review Score Threshold', type: 'number', value: '30', hint: 'Receipts with score ≥ this are flagged for review' },
      { key: 'fraud_daily_receipt_cap', label: 'Max Receipts per User per Day', type: 'number', value: '10' },
      { key: 'fraud_max_amount', label: 'Max Single Receipt Amount ($)', type: 'number', value: '500' },
    ],
  },
  {
    title: 'Business Age Badges',
    desc: 'Configure years required for each age badge',
    fields: [
      { key: 'age_new_max', label: 'New Business (max years)', type: 'number', value: '3' },
      { key: 'age_established_min', label: 'Established Business (min years)', type: 'number', value: '3' },
      { key: 'age_legacy_min', label: 'Legacy Business (min years)', type: 'number', value: '10' },
      { key: 'age_historic_min', label: 'Historic Business (min years)', type: 'number', value: '25' },
      { key: 'age_landmark_min', label: 'Community Landmark (min years)', type: 'number', value: '50' },
    ],
  },
];

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">System Configuration</h1>
            <p className="text-gray-400 mt-1">Super Admin only — changes take effect immediately</p>
          </div>
          <div className="flex items-center gap-3">
            {savedAt && (
              <span className="text-xs text-green-400">✓ Saved at {savedAt}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold disabled:opacity-60"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-300">
            Changes to points configuration, tier thresholds, and fraud detection affect all users immediately. Changes to pricing require payment processor synchronization.
          </p>
        </div>

        {SECTIONS.map((section, si) => (
          <div key={si} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="font-bold text-gray-100">{section.title}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{section.desc}</p>
            </div>
            <div className="p-6 space-y-4">
              {section.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    defaultValue={field.value}
                    onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {field.hint && (
                    <p className="text-xs text-gray-500 mt-1">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Danger zone */}
        <div className="bg-red-900/20 rounded-2xl border border-red-700/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-700/40">
            <h2 className="font-bold text-red-400">Danger Zone</h2>
            <p className="text-sm text-gray-400 mt-0.5">Irreversible actions — use with extreme caution</p>
          </div>
          <div className="p-6 space-y-3">
            {[
              { label: 'Reset All Leaderboards', desc: 'Clears current period leaderboard data' },
              { label: 'Purge Receipt Queue', desc: 'Permanently deletes all pending receipt submissions' },
              { label: 'Suspend All Ad Campaigns', desc: 'Pauses all active advertising campaigns' },
            ].map((action, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-900/20 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-200 text-sm">{action.label}</p>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
                <button className="text-xs px-4 py-2 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/40 font-semibold">
                  Execute
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
