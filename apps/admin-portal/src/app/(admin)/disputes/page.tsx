'use client';

import { useState } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const MOCK_DISPUTES = [
  { id: '1', type: 'receipt', user: 'Marcus Johnson', subject: 'Points not awarded for approved receipt', description: 'My receipt was approved 3 days ago but I still haven\'t received my 47 points.', status: 'open', priority: 'medium', created: '2024-05-24', receipt_id: 'REC-4721' },
  { id: '2', type: 'review', user: 'Unknown User', subject: 'Unfair negative review — competitor', description: 'This review appears to be from a competitor. Reviewer has no purchase history at my location.', status: 'investigating', priority: 'high', created: '2024-05-23', business_id: 'BIZ-0124' },
  { id: '3', type: 'fraud', user: 'jdoe_fake', subject: 'Account created to spam reviews', description: 'This account was created last week and has posted 12 negative reviews on the same businesses.', status: 'open', priority: 'critical', created: '2024-05-22' },
  { id: '4', type: 'receipt', user: 'Aaliyah Brown', subject: 'Receipt rejected incorrectly', description: 'My receipt was rejected for "duplicate" but I have never submitted this receipt before. This was my first submission.', status: 'resolved', priority: 'low', created: '2024-05-20' },
];

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-red-900/40 text-red-400',
  high: 'bg-orange-900/40 text-orange-400',
  medium: 'bg-yellow-900/40 text-yellow-400',
  low: 'bg-slate-600 text-gray-300',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-900/40 text-blue-400',
  investigating: 'bg-yellow-900/40 text-yellow-400',
  resolved: 'bg-green-900/40 text-green-400',
  closed: 'bg-slate-700 text-gray-500',
};

const TYPE_ICONS: Record<string, string> = {
  receipt: '🧾',
  review: '⭐',
  fraud: '🚨',
  other: '❓',
};

export default function DisputesPage() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filtered = MOCK_DISPUTES.filter(d =>
    statusFilter === 'All' || d.status === statusFilter.toLowerCase()
  );

  const selected = MOCK_DISPUTES.find(d => d.id === selectedDispute);

  const stats = {
    open: MOCK_DISPUTES.filter(d => d.status === 'open').length,
    investigating: MOCK_DISPUTES.filter(d => d.status === 'investigating').length,
    resolved: MOCK_DISPUTES.filter(d => d.status === 'resolved').length,
    critical: MOCK_DISPUTES.filter(d => d.priority === 'critical').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Disputes</h1>
        <p className="text-gray-400 mt-1">Review and resolve user and business disputes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Open', value: stats.open, color: 'text-blue-400' },
          { label: 'Investigating', value: stats.investigating, color: 'text-yellow-400' },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-400' },
          { label: 'Critical', value: stats.critical, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['All', 'Open', 'Investigating', 'Resolved', 'Closed'].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statusFilter === f ? 'bg-green-700 text-white' : 'bg-slate-800 text-gray-400 border border-slate-700 hover:border-slate-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dispute list */}
        <div className="space-y-3">
          {filtered.map(dispute => (
            <button
              key={dispute.id}
              onClick={() => setSelectedDispute(dispute.id === selectedDispute ? null : dispute.id)}
              className={`w-full text-left bg-slate-800 rounded-xl border p-4 transition-all ${
                selectedDispute === dispute.id ? 'border-green-600' : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{TYPE_ICONS[dispute.type]}</span>
                  <div>
                    <p className="font-semibold text-gray-200 text-sm">{dispute.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{dispute.user} · {dispute.created}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLES[dispute.priority]}`}>
                    {dispute.priority}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[dispute.status]}`}>
                    {dispute.status}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{dispute.description}</p>
            </button>
          ))}
        </div>

        {/* Dispute detail */}
        {selected ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 h-fit">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-100">{selected.subject}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{selected.user} · {selected.created}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_STYLES[selected.status]}`}>
                {selected.status}
              </span>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-4">
              <button className="flex items-center gap-1 px-3 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-semibold">
                <CheckCircle size={14} /> Resolve
              </button>
              <button className="flex items-center gap-1 px-3 py-2 bg-yellow-700/50 hover:bg-yellow-700 text-yellow-300 rounded-lg text-xs font-semibold">
                <AlertCircle size={14} /> Investigate
              </button>
              <button className="flex items-center gap-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-gray-200 rounded-lg text-xs font-semibold">
                <XCircle size={14} /> Close
              </button>
            </div>

            {/* Reply */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Reply to User</label>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-gray-200 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Type your response..."
              />
              <button className="mt-2 flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm font-semibold">
                <MessageSquare size={14} /> Send Reply
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center p-12 text-gray-600">
            <div className="text-center">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a dispute to review</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
