'use client';

import { useState } from 'react';
import { ShieldCheck, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

const MOCK_REQUESTS = [
  { id: '1', business: 'Northside Auto Repair', owner: 'Darnell Hayes', level: 'pro', submitted: '2024-05-24', documents: ['business_license.pdf', 'utility_bill.pdf', 'website_screenshot.png'], status: 'pending', notes: '' },
  { id: '2', business: 'East Jacksonville Catering', owner: 'Simone Carter', level: 'elite', submitted: '2024-05-22', documents: ['license.pdf', 'insurance.pdf', 'bbb_report.pdf', 'operational_review.pdf'], status: 'pending', notes: '' },
  { id: '3', business: 'Springfield Community Yoga', owner: 'Rachel Freeman', level: 'basic', submitted: '2024-05-20', documents: ['id_front.jpg', 'id_back.jpg'], status: 'approved', notes: 'All documents verified' },
  { id: '4', business: 'Durkeeville Print Shop', owner: 'Kevin Harris', level: 'pro', submitted: '2024-05-18', documents: ['registration.pdf', 'address_proof.pdf'], status: 'rejected', notes: 'Address document is expired (2022). Please resubmit with current proof.' },
];

const LEVEL_COLORS: Record<string, { text: string; bg: string }> = {
  basic: { text: 'text-gray-300', bg: 'bg-slate-600/50' },
  pro: { text: 'text-green-400', bg: 'bg-green-900/40' },
  elite: { text: 'text-yellow-400', bg: 'bg-yellow-900/40' },
  community_trusted: { text: 'text-purple-400', bg: 'bg-purple-900/40' },
};

const LEVEL_LABELS: Record<string, string> = {
  basic: 'Greenwood Basic™',
  pro: 'Greenwood Pro™',
  elite: 'Greenwood Elite™',
  community_trusted: 'Community Trusted™',
};

const REQUIRED_DOCS: Record<string, string[]> = {
  basic: ['Government ID (front + back)', 'Phone verification code', 'Email verification code'],
  pro: ['Business registration certificate', 'Utility bill (last 3 months)', 'Website URL verification', 'Social media profile URLs'],
  elite: ['All Pro documents', 'Professional license(s)', 'Current insurance certificate', 'BBB or equivalent reputation report', 'Operational history documents'],
};

export default function VerificationQueuePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = MOCK_REQUESTS.filter(r =>
    statusFilter === 'All' || r.status === statusFilter.toLowerCase()
  );

  const selectedReq = MOCK_REQUESTS.find(r => r.id === selected);

  const stats = {
    pending: MOCK_REQUESTS.filter(r => r.status === 'pending').length,
    approved: MOCK_REQUESTS.filter(r => r.status === 'approved').length,
    rejected: MOCK_REQUESTS.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Verification Queue</h1>
        <p className="text-gray-400 mt-1">Review and approve Greenwood Check™ verification requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', value: stats.pending, icon: <Clock size={18} className="text-yellow-400" />, color: 'text-yellow-400' },
          { label: 'Approved', value: stats.approved, icon: <CheckCircle size={18} className="text-green-400" />, color: 'text-green-400' },
          { label: 'Rejected', value: stats.rejected, icon: <XCircle size={18} className="text-red-400" />, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-4">
            {s.icon}
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
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
        {/* Request list */}
        <div className="space-y-3">
          {filtered.map(req => (
            <button
              key={req.id}
              onClick={() => setSelected(req.id === selected ? null : req.id)}
              className={`w-full text-left bg-slate-800 rounded-xl border p-4 transition-all ${
                selected === req.id ? 'border-green-600' : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className={LEVEL_COLORS[req.level]?.text ?? 'text-gray-400'} />
                  <div>
                    <p className="font-semibold text-gray-200">{req.business}</p>
                    <p className="text-xs text-gray-500">{req.owner} · {req.submitted}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${LEVEL_COLORS[req.level]?.bg} ${LEVEL_COLORS[req.level]?.text}`}>
                    {LEVEL_LABELS[req.level]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    req.status === 'approved' ? 'bg-green-900/40 text-green-400' :
                    req.status === 'rejected' ? 'bg-red-900/40 text-red-400' :
                    'bg-yellow-900/40 text-yellow-400'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">{req.documents.length} document{req.documents.length !== 1 ? 's' : ''} submitted</div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selectedReq ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4 h-fit">
            <div>
              <h3 className="font-bold text-gray-100">{selectedReq.business}</h3>
              <p className="text-sm text-gray-400">{selectedReq.owner} · Applied for {LEVEL_LABELS[selectedReq.level]}</p>
            </div>

            {/* Checklist */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Required Documents</p>
              {(REQUIRED_DOCS[selectedReq.level] ?? []).map((doc, i) => {
                const submitted = selectedReq.documents[i];
                return (
                  <div key={i} className="flex items-center gap-2 py-1">
                    {submitted
                      ? <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                      : <XCircle size={14} className="text-gray-600 flex-shrink-0" />}
                    <span className={`text-sm ${submitted ? 'text-gray-300' : 'text-gray-600'}`}>{doc}</span>
                    {submitted && <span className="text-xs text-gray-500 ml-auto">{submitted}</span>}
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Admin Notes</label>
              <textarea
                value={notes || selectedReq.notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-gray-200 resize-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Add notes or feedback for the business..."
              />
            </div>

            {selectedReq.status === 'pending' && (
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-xl font-bold text-sm">
                  <CheckCircle size={16} /> Approve
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-700/70 hover:bg-red-700 text-red-100 rounded-xl font-bold text-sm">
                  <XCircle size={16} /> Reject
                </button>
              </div>
            )}

            {selectedReq.status !== 'pending' && (
              <div className={`rounded-lg p-3 text-sm ${selectedReq.status === 'approved' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {selectedReq.status === 'approved' ? '✓ This request was approved' : '✗ This request was rejected'}
                {selectedReq.notes && <p className="mt-1 text-xs opacity-80">{selectedReq.notes}</p>}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center p-12 text-gray-600">
            <div className="text-center">
              <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a request to review</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
