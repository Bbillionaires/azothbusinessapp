'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
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
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
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
            Your Business,<br />
            <span className="text-brand-gold-400">Empowered.</span>
          </h1>
          <p className="mt-4 text-brand-green-200 text-lg leading-relaxed">
            Manage your listing, connect with customers, and grow your community presence — all from one dashboard.
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

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-8">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-brand-green-700 font-medium hover:underline">
              Register your business
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              leftAddon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              leftAddon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-xs text-brand-green-700 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={isSubmitting} size="lg">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
