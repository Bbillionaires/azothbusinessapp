'use client';

import React, { useState } from 'react';
import { Plus, Tag, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'bogo' | 'free';
  discountValue: string;
  startDate: string;
  endDate: string;
  active: boolean;
  redemptions: number;
}

const DEMO_OFFERS: Offer[] = [
  { id: '1', title: '20% Off First Visit', description: 'New customers only', discountType: 'percentage', discountValue: '20', startDate: '2026-05-01', endDate: '2026-06-30', active: true, redemptions: 47 },
  { id: '2', title: 'Buy One Get One Free', description: 'On all beverages', discountType: 'bogo', discountValue: '', startDate: '2026-05-15', endDate: '2026-05-31', active: true, redemptions: 23 },
  { id: '3', title: '$5 Off Orders Over $25', description: 'Weekend special', discountType: 'fixed', discountValue: '5', startDate: '2026-04-01', endDate: '2026-04-30', active: false, redemptions: 89 },
];

interface FormData {
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'bogo' | 'free';
  discountValue: string;
  startDate: string;
  endDate: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>(DEMO_OFFERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const { register, handleSubmit, reset, watch } = useForm<FormData>();
  const discountType = watch('discountType');

  function openCreate() {
    setEditingOffer(null);
    reset({ title: '', description: '', discountType: 'percentage', discountValue: '', startDate: '', endDate: '' });
    setModalOpen(true);
  }

  function openEdit(offer: Offer) {
    setEditingOffer(offer);
    reset({ title: offer.title, description: offer.description, discountType: offer.discountType, discountValue: offer.discountValue, startDate: offer.startDate, endDate: offer.endDate });
    setModalOpen(true);
  }

  function onSubmit(data: FormData) {
    if (editingOffer) {
      setOffers((prev) => prev.map((o) => o.id === editingOffer.id ? { ...editingOffer, ...data } : o));
    } else {
      setOffers((prev) => [...prev, { id: Date.now().toString(), ...data, active: true, redemptions: 0 }]);
    }
    setModalOpen(false);
  }

  function toggleActive(id: string) {
    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, active: !o.active } : o));
  }

  function deleteOffer(id: string) {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  }

  function formatDiscount(offer: Offer) {
    if (offer.discountType === 'percentage') return `${offer.discountValue}% off`;
    if (offer.discountType === 'fixed') return `$${offer.discountValue} off`;
    if (offer.discountType === 'bogo') return 'Buy One Get One';
    return 'Free item';
  }

  const columns: Column<Offer>[] = [
    {
      key: 'title',
      header: 'Offer',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
          <Tag className="h-3 w-3" />
          {formatDiscount(row)}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Period',
      render: (row) => (
        <span className="text-xs text-gray-600">
          {format(new Date(row.startDate), 'MMM d')} – {format(new Date(row.endDate), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'redemptions',
      header: 'Redemptions',
      render: (row) => <span className="font-semibold text-gray-900">{row.redemptions}</span>,
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${row.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {row.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => toggleActive(row.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title={row.active ? 'Deactivate' : 'Activate'}>
            {row.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => deleteOffer(row.id)} className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Offers</h1>
          <p className="page-subtitle">Create and manage special deals to attract new customers.</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          New Offer
        </Button>
      </div>

      <DataTable columns={columns} data={offers} keyExtractor={(r) => r.id} emptyMessage="No offers yet. Create your first offer!" />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingOffer ? 'Edit Offer' : 'New Offer'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)}>{editingOffer ? 'Save Changes' : 'Create Offer'}</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Offer Title" required {...register('title')} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent" {...register('description')} />
          </div>
          <Select
            label="Discount Type"
            options={[
              { value: 'percentage', label: 'Percentage Off' },
              { value: 'fixed', label: 'Fixed Dollar Amount Off' },
              { value: 'bogo', label: 'Buy One Get One' },
              { value: 'free', label: 'Free Item' },
            ]}
            {...register('discountType')}
          />
          {discountType !== 'bogo' && discountType !== 'free' && (
            <Input label="Discount Value" type="number" step="0.01" placeholder={discountType === 'percentage' ? '20' : '5.00'} {...register('discountValue')} />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" {...register('startDate')} />
            <Input label="End Date" type="date" {...register('endDate')} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
