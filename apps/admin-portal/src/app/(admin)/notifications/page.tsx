'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  User,
  Briefcase,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { createBrowserClient } from '@supabase/ssr';

type TargetType = 'all' | 'user' | 'business_followers';

interface NotificationForm {
  title: string;
  body: string;
  target_type: TargetType;
  target_id: string;
}

interface SentNotification {
  id: string;
  title: string;
  body: string;
  target_type: TargetType;
  target_id: string | null;
  target_label: string;
  sent_at: string;
  status: 'success' | 'failed';
  recipients: number;
}

interface DbNotification {
  id: string;
  user_id: string | null;
  type: string | null;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
  profiles: { display_name: string | null; email: string | null } | null;
}

const TARGET_OPTIONS: Array<{ value: TargetType; label: string; icon: React.ElementType; hint: string }> = [
  { value: 'all', label: 'All Users', icon: Users, hint: 'Broadcast to every registered user' },
  { value: 'user', label: 'Specific User', icon: User, hint: 'Send to a single user by ID or email' },
  { value: 'business_followers', label: 'Business Followers', icon: Briefcase, hint: 'Users who follow a specific business' },
];

function TargetBadge({ type }: { type: TargetType }) {
  const colors: Record<TargetType, string> = {
    all: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    user: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    business_followers: 'bg-green-500/10 text-green-400 border-green-500/20',
  };
  const labels: Record<TargetType, string> = {
    all: 'All Users',
    user: 'Single User',
    business_followers: 'Biz Followers',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[type]}`}>
      {labels[type]}
    </span>
  );
}

export default function NotificationsPage() {
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    body: '',
    target_type: 'all',
    target_id: '',
  });
  const [userSearch, setUserSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchHistory() {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*, profiles!user_id(display_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        const mapped: SentNotification[] = (data as unknown as DbNotification[]).map(n => ({
          id: n.id,
          title: n.title,
          body: n.body,
          target_type: (n.type as TargetType) ?? 'user',
          target_id: n.user_id,
          target_label: n.profiles?.display_name ?? n.profiles?.email ?? n.user_id ?? 'Unknown',
          sent_at: n.created_at,
          status: 'success' as const,
          recipients: 1,
        }));
        setHistory(mapped);
      }
      setHistoryLoading(false);
    }
    fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTarget = TARGET_OPTIONS.find((t) => t.value === form.target_type)!;
  const needsTargetId = form.target_type !== 'all';

  const isFormValid =
    form.title.trim().length > 0 &&
    form.body.trim().length > 0 &&
    (!needsTargetId || form.target_id.trim().length > 0);

  const handleSend = useCallback(async () => {
    if (!isFormValid) return;
    setSending(true);
    setSendResult(null);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        body: form.body.trim(),
        target_type: form.target_type,
      };
      if (needsTargetId && form.target_id.trim()) {
        payload.target_id = form.target_id.trim();
      }

      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setSendResult({ success: false, message: data.error ?? 'Failed to send notification.' });
        return;
      }

      setSendResult({ success: true, message: 'Notification sent successfully.' });

      // Optimistically prepend to history
      const newEntry: SentNotification = {
        id: `notif-${Date.now()}`,
        title: form.title.trim(),
        body: form.body.trim(),
        target_type: form.target_type,
        target_id: needsTargetId ? form.target_id.trim() : null,
        target_label:
          form.target_type === 'all'
            ? 'All Users'
            : form.target_id.trim(),
        sent_at: new Date().toISOString(),
        status: 'success',
        recipients: data.recipients ?? (form.target_type === 'all' ? 0 : 1),
      };
      setHistory((prev) => [newEntry, ...prev]);

      // Reset form
      setForm({ title: '', body: '', target_type: 'all', target_id: '' });
      setUserSearch('');
    } catch {
      setSendResult({ success: false, message: 'Network error — please try again.' });
    } finally {
      setSending(false);
    }
  }, [form, isFormValid, needsTargetId]);

  const filteredHistory = history.filter((n) => {
    if (!historySearch) return true;
    const q = historySearch.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.body.toLowerCase().includes(q) ||
      n.target_label.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Compose notification */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-green-400" />
          <h2 className="text-base font-semibold text-slate-200">Send Push Notification</h2>
        </div>

        <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-6 space-y-5">
          {/* Target selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
              Audience
            </label>
            <div className="grid grid-cols-3 gap-3">
              {TARGET_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = form.target_type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, target_type: opt.value, target_id: '' }))}
                    className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all ${
                      selected
                        ? 'bg-green-500/10 border-green-500/40 text-green-400'
                        : 'bg-[#0F172A] border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </div>
                    <span className="text-xs text-slate-500">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target ID (user or business) */}
          {needsTargetId && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                {form.target_type === 'user' ? 'User ID or Email' : 'Business ID'}
              </label>
              <div className="flex items-center gap-2 bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2.5">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder={
                    form.target_type === 'user'
                      ? 'Enter user UUID or email address…'
                      : 'Enter business UUID…'
                  }
                  value={form.target_id}
                  onChange={(e) => setForm((f) => ({ ...f, target_id: e.target.value }))}
                  className="bg-transparent text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none w-full"
                />
              </div>
              {form.target_type === 'user' && (
                <p className="mt-1 text-xs text-slate-500">
                  Accepts a Supabase user UUID or registered email address.
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
              Notification Title
            </label>
            <input
              type="text"
              placeholder="e.g. New rewards available this weekend!"
              maxLength={100}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-green-500/50 transition-colors"
            />
            <div className="mt-1 text-right text-xs text-slate-600">{form.title.length}/100</div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
              Message Body
            </label>
            <textarea
              placeholder="Write the notification message here…"
              maxLength={250}
              rows={3}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-green-500/50 transition-colors resize-none"
            />
            <div className="mt-1 text-right text-xs text-slate-600">{form.body.length}/250</div>
          </div>

          {/* Preview */}
          {(form.title || form.body) && (
            <div className="bg-[#0F172A] border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Preview</p>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{form.title || 'Notification Title'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{form.body || 'Notification body text.'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result banner */}
          {sendResult && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                sendResult.success
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {sendResult.success ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              {sendResult.message}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <selectedTarget.icon className="w-3.5 h-3.5" />
              <span>Sending to: <span className="text-slate-300">{selectedTarget.label}</span></span>
              {needsTargetId && form.target_id && (
                <span className="text-slate-400">→ {form.target_id}</span>
              )}
            </div>
            <button
              type="button"
              disabled={!isFormValid || sending}
              onClick={handleSend}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {sending ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Notification history */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-200">Notification History</h2>
          <div className="flex items-center gap-2 bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 w-64">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search history…"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="bg-transparent text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none w-full"
            />
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-700 rounded-xl overflow-hidden">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading notification history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No notifications found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide w-1/3">
                    Notification
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Audience
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Target
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Sent
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredHistory.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-200 truncate max-w-xs">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{n.body}</p>
                    </td>
                    <td className="px-4 py-3">
                      <TargetBadge type={n.target_type} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                      {n.target_id ? n.target_label : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {format(new Date(n.sent_at), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {n.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {n.recipients > 0 ? `${n.recipients.toLocaleString()} sent` : 'Sent'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
