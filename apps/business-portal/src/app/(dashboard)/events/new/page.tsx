'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@supabase/ssr';

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  endTime: z.string().optional(),
  location: z.string().min(3, 'Location is required'),
  capacity: z.coerce.number().int().positive('Capacity must be a positive number'),
  priceType: z.enum(['free', 'paid']),
  price: z.coerce.number().min(0).optional(),
  category: z.enum(['community', 'vendor_market', 'art_walk', 'food_truck', 'grand_opening', 'networking', 'workshop', 'fundraiser', 'other']).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function NewEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('businesses').select('id').eq('owner_id', user.id).eq('status', 'active').limit(1).maybeSingle();
      setBusinessId(data?.id ?? null);
    }
    load();
  }, []);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priceType: 'free', capacity: 100 },
  });

  const priceType = watch('priceType');

  async function onSubmit(data: FormData) {
    if (!businessId) { setError('No active business found'); return; }
    setSaving(true);
    setError(null);
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: businessId,
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        end_time: data.endTime,
        location: data.location,
        capacity: data.capacity,
        is_free: data.priceType === 'free',
        price: data.priceType === 'paid' ? data.price : null,
        event_type: data.category ?? 'community',
        image_url: data.imageUrl ?? null,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? 'Failed to create event'); setSaving(false); return; }
    router.push('/events');
  }

  return (
    <div className="page-container max-w-2xl">
      <div className="page-header">
        <Link href="/events" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </Link>
        <h1 className="page-title">Create New Event</h1>
        <p className="page-subtitle">Share your upcoming event with the Local First Rewards™ community.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="section-card space-y-5">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>}
        <Input label="Event Title" required error={errors.title?.message} {...register('title')} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Tell people what to expect at this event..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent hover:border-gray-400 transition-colors resize-none"
            {...register('description')}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" type="date" required error={errors.date?.message} {...register('date')} />
          <Input label="Start Time" type="time" required error={errors.time?.message} {...register('time')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="End Time" type="time" {...register('endTime')} />
          <Input label="Max Capacity" type="number" required error={errors.capacity?.message} {...register('capacity')} />
        </div>

        <Input label="Location / Address" required placeholder="123 Main St or Virtual (Zoom link)" error={errors.location?.message} {...register('location')} />

        <Select
          label="Event Category"
          options={[
            { value: 'community', label: 'Community' },
            { value: 'vendor_market', label: 'Vendor Market' },
            { value: 'art_walk', label: 'Art Walk' },
            { value: 'food_truck', label: 'Food Truck Event' },
            { value: 'grand_opening', label: 'Grand Opening' },
            { value: 'networking', label: 'Networking' },
            { value: 'workshop', label: 'Workshop / Class' },
            { value: 'fundraiser', label: 'Fundraiser' },
            { value: 'other', label: 'Other' },
          ]}
          placeholder="Select category"
          {...register('category')}
        />

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Pricing</label>
          <div className="flex gap-3">
            {(['free', 'paid'] as const).map((type) => (
              <label key={type} className={`flex-1 flex items-center gap-2 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${priceType === type ? 'border-brand-green-600 bg-brand-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" value={type} {...register('priceType')} className="accent-brand-green-700" />
                <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
              </label>
            ))}
          </div>
          {priceType === 'paid' && (
            <div className="mt-3">
              <Input label="Ticket Price ($)" type="number" step="0.01" min="0" error={errors.price?.message} {...register('price')} />
            </div>
          )}
        </div>

        <Input label="Event Image URL" type="url" placeholder="https://..." hint="Optional: link to a promotional image" {...register('imageUrl')} />

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
          <Link href="/events"><Button variant="ghost">Cancel</Button></Link>
          <Button type="submit" loading={saving}>Publish Event</Button>
        </div>
      </form>
    </div>
  );
}
