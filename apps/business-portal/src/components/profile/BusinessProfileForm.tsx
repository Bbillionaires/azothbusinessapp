'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { HoursEditor, type DayHours } from './HoursEditor';
import type { BusinessProfile } from '@/hooks/useBusiness';
import { createClient } from '@/lib/supabase';
import {
  Globe,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'restaurant', label: 'Restaurant & Food' },
  { value: 'retail', label: 'Retail & Shopping' },
  { value: 'beauty', label: 'Beauty & Wellness' },
  { value: 'health', label: 'Health & Medical' },
  { value: 'professional', label: 'Professional Services' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'technology', label: 'Technology' },
  { value: 'education', label: 'Education & Training' },
  { value: 'entertainment', label: 'Entertainment & Events' },
  { value: 'realestate', label: 'Real Estate' },
  { value: 'construction', label: 'Construction & Home' },
  { value: 'financial', label: 'Financial Services' },
  { value: 'nonprofit', label: 'Non-Profit' },
  { value: 'other', label: 'Other' },
];

const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'] as const;

type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

const schema = z.object({
  name: z.string().min(2, 'Business name is required'),
  description: z.string().max(1000).optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  family_name: z.string().optional(),
  year_founded: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional().or(z.literal('')),
  referral_percentage: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  referral_fixed_amount: z.coerce.number().min(0).optional().or(z.literal('')),
  social_facebook: z.string().optional(),
  social_instagram: z.string().optional(),
  social_twitter: z.string().optional(),
  social_linkedin: z.string().optional(),
  social_tiktok: z.string().optional(),
  social_youtube: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface BusinessProfileFormProps {
  business: BusinessProfile | null;
  onSubmit: (data: Partial<BusinessProfile>) => Promise<unknown>;
}

function getSocialUrl(business: BusinessProfile | null, platform: SocialPlatform): string {
  const record = business?.business_social?.find(
    (s) => (s as Record<string, string>).platform === platform
  );
  return (record as Record<string, string> | undefined)?.url ?? '';
}

export function BusinessProfileForm({ business, onSubmit }: BusinessProfileFormProps) {
  const [hours, setHours] = useState<Record<string, DayHours>>(
    (business?.hours as Record<string, DayHours>) ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: business?.name ?? '',
      description: business?.description ?? '',
      phone: business?.phone ?? '',
      email: business?.email ?? '',
      website: business?.website ?? '',
      address: business?.address ?? '',
      city: business?.city ?? '',
      state: business?.state ?? '',
      zip: business?.zip ?? '',
      category: business?.category ?? '',
      tags: business?.tags?.join(', ') ?? '',
      family_name: business?.family_name ?? '',
      year_founded: business?.year_founded ?? '',
      referral_percentage: business?.referral_percentage ?? '',
      referral_fixed_amount: business?.referral_fixed_amount ?? '',
      social_facebook: getSocialUrl(business, 'facebook'),
      social_instagram: getSocialUrl(business, 'instagram'),
      social_twitter: getSocialUrl(business, 'twitter'),
      social_linkedin: getSocialUrl(business, 'linkedin'),
      social_tiktok: getSocialUrl(business, 'tiktok'),
      social_youtube: getSocialUrl(business, 'youtube'),
    },
  });

  async function handleFormSubmit(data: FormData) {
    if (!business?.id) return;
    setSaving(true);
    setSuccess(false);
    try {
      const { social_facebook, social_instagram, social_twitter, social_linkedin, social_tiktok, social_youtube, ...rest } = data;

      await onSubmit({
        ...rest,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        hours,
        year_founded: data.year_founded ? Number(data.year_founded) : null,
        referral_percentage: data.referral_percentage ? Number(data.referral_percentage) : null,
        referral_fixed_amount: data.referral_fixed_amount ? Number(data.referral_fixed_amount) : null,
      });

      // Update social links separately
      const supabase = createClient();
      const socialUpdates: Array<{ platform: string; url: string }> = [
        { platform: 'facebook', url: social_facebook ?? '' },
        { platform: 'instagram', url: social_instagram ?? '' },
        { platform: 'twitter', url: social_twitter ?? '' },
        { platform: 'linkedin', url: social_linkedin ?? '' },
        { platform: 'tiktok', url: social_tiktok ?? '' },
        { platform: 'youtube', url: social_youtube ?? '' },
      ];

      for (const { platform, url } of socialUpdates) {
        if (url.trim()) {
          await supabase.from('business_social').upsert(
            { business_id: business.id, platform, url: url.trim() },
            { onConflict: 'business_id,platform' }
          );
        } else {
          await supabase.from('business_social')
            .delete()
            .eq('business_id', business.id)
            .eq('platform', platform);
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Basic Info */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Business Name"
              required
              error={errors.name?.message}
              {...register('name')}
            />
          </div>
          <div className="md:col-span-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={4}
                placeholder="Tell customers what makes your business special..."
                {...register('description')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent hover:border-gray-400 transition-colors resize-none"
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>
          </div>
          <Input
            label="Phone"
            type="tel"
            leftAddon={<Phone className="h-4 w-4" />}
            {...register('phone')}
          />
          <Input
            label="Email"
            type="email"
            leftAddon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <div className="md:col-span-2">
            <Input
              label="Website"
              type="url"
              placeholder="https://yourwebsite.com"
              leftAddon={<Globe className="h-4 w-4" />}
              error={errors.website?.message}
              {...register('website')}
            />
          </div>
          <Select
            label="Category"
            options={CATEGORIES}
            placeholder="Select a category"
            {...register('category')}
          />
          <Input
            label="Tags"
            placeholder="coffee, wifi, outdoor seating…"
            hint="Comma-separated keywords"
            {...register('tags')}
          />
          <Input
            label="Family / Founder Name"
            placeholder="e.g. The Johnson Family"
            {...register('family_name')}
          />
          <Input
            label="Year Founded"
            type="number"
            placeholder="2005"
            error={errors.year_founded?.message}
            {...register('year_founded')}
          />
        </div>
      </section>

      {/* Address */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Address
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Street Address"
              leftAddon={<MapPin className="h-4 w-4" />}
              {...register('address')}
            />
          </div>
          <Input label="City" {...register('city')} />
          <Input label="State" {...register('state')} />
          <Input label="ZIP / Postal Code" {...register('zip')} />
        </div>
      </section>

      {/* Business Hours */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Business Hours
        </h2>
        <HoursEditor value={hours} onChange={setHours} />
      </section>

      {/* Referral Program */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Referral Program
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Referral Percentage (%)"
            type="number"
            step="0.01"
            placeholder="e.g. 5"
            hint="Percentage of sale awarded to referrer"
            {...register('referral_percentage')}
          />
          <Input
            label="Fixed Referral Amount ($)"
            type="number"
            step="0.01"
            placeholder="e.g. 10"
            hint="Flat dollar amount per referral"
            {...register('referral_fixed_amount')}
          />
        </div>
      </section>

      {/* Social Media */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Social Media
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Facebook"
            placeholder="https://facebook.com/yourbusiness"
            leftAddon={<Facebook className="h-4 w-4" />}
            {...register('social_facebook')}
          />
          <Input
            label="Instagram"
            placeholder="https://instagram.com/yourbusiness"
            leftAddon={<Instagram className="h-4 w-4" />}
            {...register('social_instagram')}
          />
          <Input
            label="Twitter / X"
            placeholder="https://x.com/yourbusiness"
            leftAddon={<span className="text-xs font-bold">𝕏</span>}
            {...register('social_twitter')}
          />
          <Input
            label="LinkedIn"
            placeholder="https://linkedin.com/company/yourbusiness"
            leftAddon={<Linkedin className="h-4 w-4" />}
            {...register('social_linkedin')}
          />
          <Input
            label="TikTok"
            placeholder="https://tiktok.com/@yourbusiness"
            leftAddon={<span className="text-xs font-bold">TT</span>}
            {...register('social_tiktok')}
          />
          <Input
            label="YouTube"
            placeholder="https://youtube.com/@yourbusiness"
            leftAddon={<Youtube className="h-4 w-4" />}
            {...register('social_youtube')}
          />
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        {success && (
          <span className="text-sm text-emerald-600 font-medium">
            Profile saved successfully!
          </span>
        )}
        {!success && <span />}
        <Button
          type="submit"
          loading={saving}
          disabled={!isDirty && Object.keys(hours).length === 0}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}
