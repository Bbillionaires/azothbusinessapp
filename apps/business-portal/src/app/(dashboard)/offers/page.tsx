'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Tag, Pencil, Trash2, Eye, EyeOff, Loader2, Gift } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { format } from 'date-fns';

type OfferType = 'discount' | 'coupon' | 'freebie' | 'gift_card';

interface BusinessOffer {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  offer_type: OfferType;
  discount_percent: number | null;
  discount_amount: number | null;
  promo_code: string | null;
  terms: string | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  points_bonus: number;
  redemption_count: number;
  max_redemptions: number | null;
  created_at: string;
}

interface FormState {
  title: string;
  description: string;
  offer_type: OfferType;
  discount_percent: string;
  discount_amount: string;
  promo_code: string;
  terms: string;
  starts_at: string;
  expires_at: string;
  points_bonus: string;
  max_redemptions: string;
}

const EMPTY_FORM: FormState = {
  title: '', description: '', offer_type: 'discount',
  discount_percent: '', discount_amount: '', promo_code: '',
  terms: '', starts_at: '', expires_at: '',
  points_bonus: '0', max_redemptions: '',
};

const OFFER_TYPE_LABELS: Record<OfferType, { label: string; color: string }> = {
  discount:  { label: 'Discount',   color: 'bg-green-100 text-green-700 border-green-200' },
  coupon:    { label: 'Coupon',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  freebie:   { label: 'Freebie',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
  gift_card: { label: 'Gift Card',  color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

function formatOfferValue(offer: BusinessOffer): string {
  if (offer.discount_percent) return `${offer.discount_percent}% off`;
  if (offer.discount_amount) return `$${offer.discount_amount} off`;
  return OFFER_TYPE_LABELS[offer.offer_type]?.label ?? offer.offer_type;
}

export default function OffersPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [offers, setOffers] = useState<BusinessOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<BusinessOffer | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      if (biz) setBusinessId(biz.id);
    }
    init();
  }, []);

  const loadOffers = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const res = await fetch(`/api/offers?business_id=${businessId}`);
    const json = await res.json();
    if (res.ok) setOffers(json);
    else setError(json.error ?? 'Failed to load offers');
    setLoading(false);
  }, [businessId]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  function openCreate() {
    setEditingOffer(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(offer: BusinessOffer) {
    setEditingOffer(offer);
    setForm({
      title: offer.title,
      description: offer.description ?? '',
      offer_type: offer.offer_type,
      discount_percent: offer.discount_percent?.toString() ?? '',
      discount_amount: offer.discount_amount?.toString() ?? '',
      promo_code: offer.promo_code ?? '',
      terms: offer.terms ?? '',
      starts_at: offer.starts_at ? offer.starts_at.split('T')[0] : '',
      expires_at: offer.expires_at ? offer.expires_at.split('T')[0] : '',
      points_bonus: offer.points_bonus?.toString() ?? '0',
      max_redemptions: offer.max_redemptions?.toString() ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    setError(null);

    const payload = {
      business_id: businessId,
      title: form.title,
      description: form.description || null,
      offer_type: form.offer_type,
      discount_percent: form.discount_percent ? Number(form.discount_percent) : null,
      discount_amount: form.discount_amount ? Number(form.discount_amount) : null,
      promo_code: form.promo_code || null,
      terms: form.terms || null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      points_bonus: Number(form.points_bonus) || 0,
      max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : null,
    };

    const url = editingOffer ? `/api/offers/${editingOffer.id}` : '/api/offers';
    const method = editingOffer ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? 'Failed to save offer'); }
    else { await loadOffers(); setModalOpen(false); }
    setSaving(false);
  }

  async function toggleActive(offer: BusinessOffer) {
    await fetch(`/api/offers/${offer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !offer.is_active }),
    });
    setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, is_active: !o.is_active } : o));
  }

  async function deleteOffer(id: string) {
    if (!confirm('Delete this offer? This cannot be undone.')) return;
    await fetch(`/api/offers/${id}`, { method: 'DELETE' });
    setOffers(prev => prev.filter(o => o.id !== id));
  }

  const f = (field: keyof FormState) => ({
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value })),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
          <p className="text-gray-500 mt-1">Create and manage special deals for your customers.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          <Plus size={16} /> New Offer
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-green-800" />
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Gift size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No offers yet</h3>
          <p className="text-gray-500 text-sm mb-6">Create your first offer to attract new customers and reward loyalty.</p>
          <button onClick={openCreate} className="px-4 py-2 bg-green-800 text-white rounded-lg font-semibold hover:bg-green-700">
            Create First Offer
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Offer</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Value</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Expires</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Redeemed</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {offers.map(offer => {
                const typeStyle = OFFER_TYPE_LABELS[offer.offer_type];
                return (
                  <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{offer.title}</div>
                      {offer.description && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-48">{offer.description}</div>}
                      {offer.promo_code && (
                        <code className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded mt-1 inline-block">{offer.promo_code}</code>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeStyle.color}`}>
                        <Tag size={11} />
                        {typeStyle.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-700">{formatOfferValue(offer)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {offer.expires_at ? format(new Date(offer.expires_at), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-900">{offer.redemption_count ?? 0}</span>
                      {offer.max_redemptions && (
                        <span className="text-gray-400 text-xs">/{offer.max_redemptions}</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${offer.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${offer.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {offer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(offer)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => toggleActive(offer)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                          {offer.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => deleteOffer(offer.id)} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingOffer ? 'Edit Offer' : 'New Offer'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" {...f('title')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" {...f('description')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Type</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" {...f('offer_type')}>
                  <option value="discount">Discount</option>
                  <option value="coupon">Coupon</option>
                  <option value="freebie">Freebie</option>
                  <option value="gift_card">Gift Card</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount % (optional)</label>
                  <input type="number" min="0" max="100" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" {...f('discount_percent')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount $ (optional)</label>
                  <input type="number" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" {...f('discount_amount')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 uppercase" {...f('promo_code')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points Bonus</label>
                  <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" {...f('points_bonus')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" {...f('starts_at')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" {...f('expires_at')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Redemptions (optional)</label>
                <input type="number" min="1" placeholder="Unlimited" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" {...f('max_redemptions')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" {...f('terms')} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-green-800 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingOffer ? 'Save Changes' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
