'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';

const schema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    businessName: z.string().min(2, 'Business name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          business_name: data.businessName,
        },
      },
    });
    if (error) {
      setServerError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email!</h2>
          <p className="text-gray-600 mb-4">
            We sent a confirmation link to your email address. Click it to activate your account.
          </p>
          <p className="text-sm text-gray-400">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-green-700 flex-col justify-center p-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-brand-gold-400 flex items-center justify-center">
            <span className="text-brand-green-900 font-black text-lg">LF</span>
          </div>
          <span className="text-white font-bold text-lg">Local First Rewards™</span>
        </div>
        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
          Join the Movement.<br />
          <span className="text-brand-gold-400">Grow Together.</span>
        </h1>
        <p className="text-brand-green-200 text-lg leading-relaxed">
          Register your business and become part of the Local First Rewards™ network — where local businesses thrive.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-brand-green-700 flex items-center justify-center">
              <span className="text-white font-black text-base">LF</span>
            </div>
            <span className="text-gray-900 font-bold">Local First Rewards™</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Register your business</h2>
          <p className="text-sm text-gray-500 mb-8">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-green-700 font-medium hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              autoComplete="name"
              required
              leftAddon={<User className="h-4 w-4" />}
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="Business Name"
              type="text"
              required
              leftAddon={<Building2 className="h-4 w-4" />}
              error={errors.businessName?.message}
              {...register('businessName')}
            />
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
              autoComplete="new-password"
              required
              leftAddon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              hint="At least 8 characters"
              {...register('password')}
            />
            <Input
              label="Confirm Password"
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
              Create Account
            </Button>

            <p className="text-xs text-gray-400 text-center">
              By registering, you agree to our{' '}
              <Link href="/terms" className="underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
