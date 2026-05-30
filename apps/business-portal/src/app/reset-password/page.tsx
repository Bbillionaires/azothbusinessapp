'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      setServerError(error.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-green-700 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-brand-gold-400 flex items-center justify-center">
              <span className="text-brand-green-900 font-black text-lg leading-none">LF</span>
            </div>
            <span className="text-white font-bold text-lg">Local First Rewards™</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Create a new<br />
            <span className="text-brand-gold-400">Password.</span>
          </h1>
          <p className="mt-4 text-brand-green-200 text-lg leading-relaxed">
            Choose a strong password to keep your business account secure.
          </p>
        </div>

        <div className="space-y-4">
          {[
            'Real-time analytics & insights',
            'Greenwood Check™ verification',
            'Referral program management',
            'Event & job posting tools',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3 text-brand-green-100">
              <ShieldCheck className="h-5 w-5 text-brand-gold-400 shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-brand-green-700 flex items-center justify-center">
              <span className="text-white font-black text-base">LF</span>
            </div>
            <span className="text-gray-900 font-bold">Local First Rewards™</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Set new password</h2>
          <p className="text-sm text-gray-500 mb-8">
            Enter and confirm your new password below.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              leftAddon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              leftAddon={<Lock className="h-4 w-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <Button type="submit" fullWidth loading={isSubmitting} size="lg">
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
