'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  title: z.string().min(3, 'Job title is required'),
  department: z.string().optional(),
  type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  location: z.string().min(2, 'Location is required'),
  salaryType: z.enum(['hourly', 'annual']),
  salaryMin: z.coerce.number().positive('Required'),
  salaryMax: z.coerce.number().positive('Required'),
  description: z.string().min(20, 'Job description must be at least 20 characters'),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  applicationEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  applicationUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function NewJobPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'full-time', salaryType: 'annual' },
  });

  async function onSubmit(_data: FormData) {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push('/jobs');
  }

  return (
    <div className="page-container max-w-2xl">
      <div className="page-header">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>
        <h1 className="page-title">Post a Job</h1>
        <p className="page-subtitle">Reach talented local candidates through the Local First Rewards™ network.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="section-card space-y-5">
        <Input label="Job Title" required error={errors.title?.message} {...register('title')} />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Employment Type"
            options={[
              { value: 'full-time', label: 'Full-Time' },
              { value: 'part-time', label: 'Part-Time' },
              { value: 'contract', label: 'Contract' },
              { value: 'internship', label: 'Internship' },
            ]}
            {...register('type')}
          />
          <Input label="Department" placeholder="e.g. Sales, Operations" {...register('department')} />
        </div>

        <Input label="Location" required placeholder="In-store, Remote, Hybrid…" error={errors.location?.message} {...register('location')} />

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Compensation</label>
          <div className="grid grid-cols-3 gap-3">
            <Select
              label=""
              options={[
                { value: 'hourly', label: 'Per Hour' },
                { value: 'annual', label: 'Per Year' },
              ]}
              {...register('salaryType')}
            />
            <Input label="" placeholder="Min" type="number" step="0.01" error={errors.salaryMin?.message} {...register('salaryMin')} />
            <Input label="" placeholder="Max" type="number" step="0.01" error={errors.salaryMax?.message} {...register('salaryMax')} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={6}
            placeholder="Describe the role, responsibilities, and what makes this opportunity great..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent hover:border-gray-400 transition-colors resize-none"
            {...register('description')}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Requirements</label>
          <textarea
            rows={3}
            placeholder="List required skills, experience, and qualifications..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent hover:border-gray-400 transition-colors resize-none"
            {...register('requirements')}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Benefits</label>
          <textarea
            rows={2}
            placeholder="Health insurance, PTO, flexible hours…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent hover:border-gray-400 transition-colors resize-none"
            {...register('benefits')}
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">How to Apply</p>
          <div className="grid grid-cols-1 gap-3">
            <Input label="Application Email" type="email" placeholder="careers@yourbusiness.com" error={errors.applicationEmail?.message} {...register('applicationEmail')} />
            <Input label="Application URL" type="url" placeholder="https://yourwebsite.com/careers" error={errors.applicationUrl?.message} {...register('applicationUrl')} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
          <Link href="/jobs"><Button variant="ghost">Cancel</Button></Link>
          <Button type="submit" loading={saving}>Publish Job</Button>
        </div>
      </form>
    </div>
  );
}
