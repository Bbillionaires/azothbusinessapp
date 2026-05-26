'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { RoleGuard } from '../../../components/layout/RoleGuard';

const SECTIONS = [
  {
    title: 'Points Configuration',
    desc: 'Configure how points are earned and spent',
    fields: [
      { key: 'points_per_dollar', label: 'Points per Dollar Spent', type: 'number', hint: '1 point = $1' },
      { key: 'receipt_daily_cap', label: 'Daily Points Cap (per user)', type: 'number', hint: '' },
      { key: 'review_points', label: 'Points per Review', type: 'number', hint: '' },
      { key: 'event_points', label: 'Points per Event Attended', type: 'number', hint: '' },
      { key: 'referral_user_points', label: 'Points for Referring a User', type: 'number', hint: '' },
      { key: 'referral_business_points', label: 'Points for Referring a Business', type: 'number', hint: '' },
    ],
  },
  {
    title: 'Tier Thresholds',
    desc: 'Minimum points required for each tier',
    fields: [
      { key: 'tier_bronze_min', label: 'Bronze Minimum', type: 'number', hint: '' },
      { key: 'tier_silver_min', label: 'Silver Minimum', type: 'number', hint: '' },
      { key: 'tier_gold_min', label: 'Gold Minimum', type: 'number', hint: '' },
      { key: 'tier_platinum_min', label: 'Platinum Minimum', type: 'number', hint: '' },
      { key: 'tier_legend_min', label: 'Legend Minimum', type: 'number', hint: '' },
    ],
  },
  {
    title: 'Business Verification Pricing',
    desc: 'Monthly pricing for Greenwood Check tiers',
    fields: [
      { key: 'price_basic', label: 'Greenwood Basic™ ($/month)', type: 'number', hint: '' },
      { key: 'price_pro', label: 'Greenwood Pro™ ($/month)', type: 'number', hint: '' },
      { key: 'price_elite', label: 'Greenwood Elite™ ($/month)', type: 'number', hint: '' },
    ],
  },
  {
    title: 'Fraud Detection',
    desc: 'Configure fraud scoring thresholds',
    fields: [
      { key: 'fraud_auto_reject_score', label: 'Auto-Reject Score Threshold', type: 'number', hint: 'Receipts with score ≥ this are auto-rejected' },
      { key: 'fraud_review_score', label: 'Manual Review Score Threshold', type: 'number', hint: 'Receipts with score ≥ this are flagged for review' },
      { key: 'fraud_daily_receipt_cap', label: 'Max Receipts per User per Day', type: 'number', hint: '' },
      { key: 'fraud_max_amount', label: 'Max Single Receipt Amount ($)', type: 'number', hint: '' },
    ],
  },
  {
    title: 'Business Age Badges',
    desc: 'Configure years required for each age badge',
    fields: [
      { key: 'age_new_max', label: 'New Business (max years)', type: 'number', hint: '' },
      { key: 'age_established_min', label: 'Established Business (min years)', type: 'number', hint: '' },
      { key: 'age_legacy_min', label: 'Legacy Business (min years)', type: 'number', hint: '' },
      { key: 'age_historic_min', label: 'Historic Business (min years)', type: 'number', hint: '' },
      { key: 'age_landmark_min', label: 'Community Landmark (min years)', type: 'number', hint: '' },
    ],
  },
];

const DEFAULTS: Record<string, string> = {
  points_per_dollar: '1', receipt_daily_cap: '500', review_points: '10',
  event_points: '25', referral_user_points: '100', referral_business_points: '500',
  tier_bronze_min: '0', tier_silver_min: '1000', tier_gold_min: '5000',
  tier_platinum_min: '20000', tier_legend_min: '100000',
  price_basic: '9.99', price_pro: '29.99', price_elite: '79.99',
  fraud_auto_reject_score: '90', fraud_review_score: '30',
  fraud_daily_receipt_cap: '10', fraud_max_amount: '500',
  age_new_max: '3', age_established_min: '3', age_legacy_min: '10',
  age_historic_min: '25', age_landmark_min: '50',
};

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase.from('platform_settings').select('key, value');
      if (data && data.length > 0) {
        const loaded: Record<string, string> = { ...DEFAULTS };
        data.forEach(row => { loaded[row.key] = row.value; });
        setValues(loaded);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    const rows = Object.entries(values).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('platform_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      setSaveError(error.message);
    } else {
      setSavedAt(new Date().toLocaleTimeString());
    }
    setSaving(false);
  };

  const handleDangerAction = async (action: string) => {
    if (!confirm(`Are you sure you want to ${action}? This cannot be undone.`)) return;
    if (action === 'suspend_all_ads') {
      await supabase.from('ad_campaigns').update({ status: 'paused' }).eq('status', 'active');
      alert('All active ad campaigns have been paused.');
    }
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
            {saveError && <span className="text-xs text-red-400">Error: {saveError}</span>}
            {savedAt && !saveError && <span className="text-xs text-green-400">✓ Saved at {savedAt}</span>}
            <button
              onClick={handleSave}
              disabled={saving || loading}
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
            Changes to points configuration, tier thresholds, and fraud detection affect all users immediately.
            Changes to pricing require payment processor synchronization.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw size={20} className="animate-spin text-gray-400" />
          </div>
        ) : (
          SECTIONS.map((section, si) => (
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
                      value={values[field.key] ?? ''}
                      onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {field.hint && <p className="text-xs text-gray-500 mt-1">{field.hint}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Danger zone */}
        <div className="bg-red-900/20 rounded-2xl border border-red-700/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-700/40">
            <h2 className="font-bold text-red-400">Danger Zone</h2>
            <p className="text-sm text-gray-400 mt-0.5">Irreversible actions — use with extreme caution</p>
          </div>
          <div className="p-6 space-y-3">
            {[
              { label: 'Suspend All Ad Campaigns', desc: 'Pauses all active advertising campaigns', action: 'suspend_all_ads' },
            ].map((action, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-900/20 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-200 text-sm">{action.label}</p>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
                <button
                  onClick={() => handleDangerAction(action.action)}
                  className="text-xs px-4 py-2 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/40 font-semibold"
                >
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
