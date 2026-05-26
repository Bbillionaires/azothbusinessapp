'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Bell, Star, Users, Receipt, Gift, CalendarCheck, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationPrefs {
  new_review: boolean;
  new_follower: boolean;
  receipt_processed: boolean;
  reward_earned: boolean;
  event_rsvp: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  new_review: true,
  new_follower: true,
  receipt_processed: true,
  reward_earned: true,
  event_rsvp: true,
};

// ─── Notification items metadata ─────────────────────────────────────────────

const NOTIFICATION_ITEMS: {
  key: keyof NotificationPrefs;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}[] = [
  {
    key: 'new_review',
    label: 'New Review',
    description: 'Get notified when a customer leaves a review for your business.',
    icon: Star,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
  {
    key: 'new_follower',
    label: 'New Follower',
    description: 'Be alerted when someone starts following your business.',
    icon: Users,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    key: 'receipt_processed',
    label: 'Receipt Processed',
    description: 'Receive updates when a customer receipt tied to your business is processed.',
    icon: Receipt,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  {
    key: 'reward_earned',
    label: 'Reward Earned',
    description: 'Find out when a customer earns a reward from your business.',
    icon: Gift,
    iconColor: 'text-brand-green-700',
    iconBg: 'bg-brand-green-50',
  },
  {
    key: 'event_rsvp',
    label: 'Event RSVP',
    description: 'Get notified when someone RSVPs to one of your events.',
    icon: CalendarCheck,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
  },
];

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green-600 focus-visible:ring-offset-2',
        checked ? 'bg-brand-green-700' : 'bg-gray-200',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow',
          'transform transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const supabase = createClient();

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Load saved preferences ──────────────────────────────────────────────────

  const loadPrefs = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_settings')
        .select('notification_prefs')
        .eq('user_id', user.id)
        .single();

      if (data?.notification_prefs) {
        setPrefs({ ...DEFAULT_PREFS, ...(data.notification_prefs as Partial<NotificationPrefs>) });
      }
    } catch {
      // No existing settings row — use defaults
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  // ── Save preferences ────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setSaveStatus('idle');
    setSaveError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('user_settings').upsert(
        {
          user_id: user.id,
          notification_prefs: prefs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;
      setSaveStatus('saved');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save preferences.');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  function togglePref(key: keyof NotificationPrefs) {
    setPrefs((prev: NotificationPrefs) => ({ ...prev, [key]: !prev[key] }));
    setSaveStatus('idle');
  }

  function setAll(enabled: boolean) {
    const next: NotificationPrefs = {
      new_review: enabled,
      new_follower: enabled,
      receipt_processed: enabled,
      reward_earned: enabled,
      event_rsvp: enabled,
    };
    setPrefs(next);
    setSaveStatus('idle');
  }

  const allEnabled = Object.values(prefs).every(Boolean);
  const noneEnabled = Object.values(prefs).every((v) => !v);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell className="h-6 w-6 text-brand-green-700" />
            Notification Preferences
          </h1>
          <p className="page-subtitle">
            Choose which activity alerts you want to receive.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          loading={saving}
          onClick={handleSave}
          leftIcon={!saving ? <Save className="h-4 w-4" /> : undefined}
        >
          {saving ? 'Saving…' : 'Save Preferences'}
        </Button>
      </div>

      {/* Success / error banner */}
      {saveStatus === 'saved' && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <span className="font-medium">Preferences saved!</span> Your notification settings have been updated.
        </div>
      )}
      {saveStatus === 'error' && saveError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* Main card */}
      <div className="section-card">
        {/* Bulk toggles */}
        <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100">
          <span className="text-sm text-gray-500">
            {NOTIFICATION_ITEMS.filter((n) => prefs[n.key]).length} of {NOTIFICATION_ITEMS.length} notifications enabled
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAll(true)}
              disabled={allEnabled}
              className="text-xs font-medium text-brand-green-700 hover:text-brand-green-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Enable all
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setAll(false)}
              disabled={noneEnabled}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Disable all
            </button>
          </div>
        </div>

        {/* Skeleton */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-6 w-11 rounded-full bg-gray-100 animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {NOTIFICATION_ITEMS.map(({ key, label, description, icon: Icon, iconColor, iconBg }) => (
              <li key={key} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                {/* Icon */}
                <div
                  className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`toggle-${key}`}
                    className="text-sm font-semibold text-gray-900 cursor-pointer"
                  >
                    {label}
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                </div>

                {/* Toggle */}
                <Toggle
                  id={`toggle-${key}`}
                  checked={prefs[key]}
                  onChange={() => togglePref(key)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer hint */}
      <p className="mt-4 text-xs text-gray-400 text-center">
        Push notifications are delivered via the Local First Rewards mobile app.
        Email delivery settings can be managed in your account profile.
      </p>
    </div>
  );
}
