'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { HoursEditor, DayHours } from '@/components/profile/HoursEditor';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BasicInfo {
  name: string;
  category: string;
  description: string;
}

interface LocationInfo {
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
}

type HoursMap = Record<string, DayHours>;

interface PhotoState {
  cover: File | null;
  gallery: File[];
  coverPreview: string | null;
  galleryPreviews: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Basics' },
  { label: 'Location' },
  { label: 'Hours' },
  { label: 'Photos' },
];

const CATEGORIES = [
  { value: 'restaurant', label: 'Restaurant & Food' },
  { value: 'retail', label: 'Retail & Shopping' },
  { value: 'health_beauty', label: 'Health & Beauty' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'home_services', label: 'Home Services' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'entertainment', label: 'Entertainment & Recreation' },
  { value: 'education', label: 'Education & Training' },
  { value: 'fitness', label: 'Fitness & Wellness' },
  { value: 'technology', label: 'Technology' },
  { value: 'nonprofit', label: 'Nonprofit & Community' },
  { value: 'other', label: 'Other' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
].map((s) => ({ value: s, label: s }));

const DEFAULT_HOURS: HoursMap = {
  monday:    { open: '09:00', close: '17:00', closed: false },
  tuesday:   { open: '09:00', close: '17:00', closed: false },
  wednesday: { open: '09:00', close: '17:00', closed: false },
  thursday:  { open: '09:00', close: '17:00', closed: false },
  friday:    { open: '09:00', close: '17:00', closed: false },
  saturday:  { open: '10:00', close: '15:00', closed: false },
  sunday:    { open: '09:00', close: '17:00', closed: true  },
};

// ─── Step components ──────────────────────────────────────────────────────────

function StepBasics({
  data,
  onChange,
  errors,
}: {
  data: BasicInfo;
  onChange: (d: Partial<BasicInfo>) => void;
  errors: Partial<Record<keyof BasicInfo, string>>;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Tell us about your business</h2>
        <p className="mt-1 text-sm text-gray-500">
          This is the first thing customers will see about you.
        </p>
      </div>

      <Input
        label="Business Name"
        required
        placeholder="e.g. Mama's Kitchen"
        value={data.name}
        onChange={(e) => onChange({ name: e.target.value })}
        error={errors.name}
      />

      <Select
        label="Category"
        required
        placeholder="Select a category"
        options={CATEGORIES}
        value={data.category}
        onChange={(e) => onChange({ category: e.target.value })}
        error={errors.category}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Description <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          rows={4}
          placeholder="Share what makes your business unique…"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent hover:border-gray-400 resize-none"
        />
        <p className="text-xs text-gray-400">{data.description.length}/500 characters</p>
      </div>
    </div>
  );
}

function StepLocation({
  data,
  onChange,
  errors,
}: {
  data: LocationInfo;
  onChange: (d: Partial<LocationInfo>) => void;
  errors: Partial<Record<keyof LocationInfo, string>>;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Where are you located?</h2>
        <p className="mt-1 text-sm text-gray-500">
          Help customers find you — on the map and in search results.
        </p>
      </div>

      <Input
        label="Street Address"
        required
        placeholder="123 Main St"
        value={data.address}
        onChange={(e) => onChange({ address: e.target.value })}
        error={errors.address}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="City"
          required
          placeholder="Atlanta"
          value={data.city}
          onChange={(e) => onChange({ city: e.target.value })}
          error={errors.city}
        />
        <Select
          label="State"
          required
          placeholder="State"
          options={US_STATES}
          value={data.state}
          onChange={(e) => onChange({ state: e.target.value })}
          error={errors.state}
        />
      </div>

      <Input
        label="ZIP Code"
        required
        placeholder="30301"
        value={data.zip}
        onChange={(e) => onChange({ zip: e.target.value })}
        error={errors.zip}
        className="max-w-[160px]"
      />

      <Input
        label="Phone Number"
        type="tel"
        placeholder="(404) 555-0100"
        value={data.phone}
        onChange={(e) => onChange({ phone: e.target.value })}
        error={errors.phone}
      />

      <Input
        label="Website"
        type="url"
        placeholder="https://yourwebsite.com"
        value={data.website}
        onChange={(e) => onChange({ website: e.target.value })}
        error={errors.website}
      />
    </div>
  );
}

function StepHours({ hours, onChange }: { hours: HoursMap; onChange: (h: HoursMap) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Set your hours</h2>
        <p className="mt-1 text-sm text-gray-500">
          Let customers know when you&apos;re open. You can always update these later.
        </p>
      </div>
      <HoursEditor value={hours} onChange={onChange} />
    </div>
  );
}

function StepPhotos({
  photos,
  onChange,
}: {
  photos: PhotoState;
  onChange: (p: Partial<PhotoState>) => void;
}) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    onChange({ cover: file, coverPreview: preview });
  }

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []) as File[];
    if (!files.length) return;
    const previews = files.map((f: File) => URL.createObjectURL(f));
    onChange({
      gallery: [...photos.gallery, ...files].slice(0, 8),
      galleryPreviews: [...photos.galleryPreviews, ...previews].slice(0, 8),
    });
  }

  function removeCover() {
    if (photos.coverPreview) URL.revokeObjectURL(photos.coverPreview);
    onChange({ cover: null, coverPreview: null });
  }

  function removeGalleryImage(index: number) {
    const newGallery = [...photos.gallery];
    const newPreviews = [...photos.galleryPreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newGallery.splice(index, 1);
    newPreviews.splice(index, 1);
    onChange({ gallery: newGallery, galleryPreviews: newPreviews });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Add some photos</h2>
        <p className="mt-1 text-sm text-gray-500">
          Businesses with photos get 2x more engagement. You can always add more later.
        </p>
      </div>

      {/* Cover photo */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Cover Photo</p>
        {photos.coverPreview ? (
          <div className="relative rounded-xl overflow-hidden h-44 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos.coverPreview}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={removeCover}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="w-full h-44 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-brand-green-500 hover:bg-brand-green-50 transition-colors group"
          >
            <Upload className="h-8 w-8 text-gray-400 group-hover:text-brand-green-600 mb-2 transition-colors" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-brand-green-700">
              Click to upload cover photo
            </span>
            <span className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 10 MB</span>
          </button>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleCoverChange}
        />
      </div>

      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">
            Gallery Photos{' '}
            <span className="text-gray-400 font-normal">({photos.gallery.length}/8)</span>
          </p>
          {photos.gallery.length < 8 && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="text-xs font-medium text-brand-green-700 hover:text-brand-green-800 underline underline-offset-2"
            >
              + Add photos
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.galleryPreviews.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeGalleryImage(i)}
                className="absolute top-1 right-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {photos.gallery.length < 8 && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-brand-green-500 hover:bg-brand-green-50 transition-colors group"
            >
              <Upload className="h-5 w-5 text-gray-400 group-hover:text-brand-green-600 transition-colors" />
              <span className="text-[10px] text-gray-400 mt-1 group-hover:text-brand-green-600">
                Add
              </span>
            </button>
          )}
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleGalleryChange}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [basics, setBasics] = useState<BasicInfo>({ name: '', category: '', description: '' });
  const [location, setLocation] = useState<LocationInfo>({
    address: '', city: '', state: '', zip: '', phone: '', website: '',
  });
  const [hours, setHours] = useState<HoursMap>(DEFAULT_HOURS);
  const [photos, setPhotos] = useState<PhotoState>({
    cover: null,
    gallery: [],
    coverPreview: null,
    galleryPreviews: [],
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {};

    if (s === 0) {
      if (!basics.name.trim()) errs.name = 'Business name is required.';
      if (!basics.category) errs.category = 'Please select a category.';
    }

    if (s === 1) {
      if (!location.address.trim()) errs.address = 'Street address is required.';
      if (!location.city.trim()) errs.city = 'City is required.';
      if (!location.state) errs.state = 'State is required.';
      if (!location.zip.trim()) errs.zip = 'ZIP code is required.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  function handleNext() {
    if (!validateStep(step)) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    setFieldErrors({});
    setStep((s) => s - 1);
  }

  // ── Upload helpers ──────────────────────────────────────────────────────────

  async function uploadPhoto(file: File, businessId: string): Promise<void> {
    const form = new FormData();
    form.append('file', file);
    form.append('business_id', businessId);
    await fetch('/api/upload', { method: 'POST', body: form });
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validateStep(step)) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Create the business
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: basics.name.trim(),
          category: basics.category,
          description: basics.description.trim() || null,
          address: location.address.trim() || null,
          city: location.city.trim() || null,
          state: location.state || null,
          zip: location.zip.trim() || null,
          phone: location.phone.trim() || null,
          website: location.website.trim() || null,
          hours,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to create business.');
      }

      const { business } = await res.json();

      // 2. Upload photos (non-blocking failures are swallowed)
      const uploads: Promise<void>[] = [];
      if (photos.cover) uploads.push(uploadPhoto(photos.cover, business.id));
      photos.gallery.forEach((f) => uploads.push(uploadPhoto(f, business.id)));
      await Promise.allSettled(uploads);

      router.push('/dashboard');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const progress = Math.round(((step) / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-green-700 flex items-center justify-center">
            <span className="text-white font-bold text-sm">LF</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm hidden sm:block">
            Local First Rewards
          </span>
        </div>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500">Business Setup</span>

        {/* Progress bar (mobile) */}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
            <div
              className="h-full bg-brand-green-700 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{step + 1} / {STEPS.length}</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg">
          {/* Step indicator */}
          <div className="mb-8">
            <StepIndicator steps={STEPS} currentStep={step} />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 sm:p-8">
            {step === 0 && (
              <StepBasics
                data={basics}
                onChange={(d) => setBasics((prev) => ({ ...prev, ...d }))}
                errors={fieldErrors}
              />
            )}
            {step === 1 && (
              <StepLocation
                data={location}
                onChange={(d) => setLocation((prev) => ({ ...prev, ...d }))}
                errors={fieldErrors}
              />
            )}
            {step === 2 && (
              <StepHours hours={hours} onChange={setHours} />
            )}
            {step === 3 && (
              <StepPhotos
                photos={photos}
                onChange={(p) => setPhotos((prev) => ({ ...prev, ...p }))}
              />
            )}

            {/* Error banner */}
            {submitError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex items-center justify-between gap-4">
              {step > 0 ? (
                <Button variant="secondary" onClick={handleBack} disabled={submitting}>
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <Button variant="primary" onClick={handleNext}>
                  Continue
                </Button>
              ) : (
                <Button
                  variant="primary"
                  loading={submitting}
                  onClick={handleSubmit}
                  leftIcon={!submitting ? <CheckCircle className="h-4 w-4" /> : undefined}
                >
                  {submitting ? 'Creating your business…' : 'Finish Setup'}
                </Button>
              )}
            </div>
          </div>

          {/* Skip link */}
          {step === STEPS.length - 1 && !submitting && (
            <p className="mt-4 text-center text-xs text-gray-400">
              Photos are optional —{' '}
              <button
                type="button"
                onClick={handleSubmit}
                className="underline underline-offset-2 hover:text-gray-600"
              >
                skip and finish
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
