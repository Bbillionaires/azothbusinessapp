'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ShieldCheck, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) {
      setServerError(error.message);
    } else {
      setSubmitted(true);
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
            Reset your<br />
            <span className="text-brand-gold-400">Password.</span>
          </h1>
          <p className="mt-4 text-brand-green-200 text-lg leading-relaxed">
            Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
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

          {submitted ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-14 w-14 text-brand-green-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-8">
                We&apos;ve sent a password reset link to your email address. Follow the link to set a new password.
              </p>
              <Link href="/login" className="text-sm text-brand-green-700 font-medium hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot password</h2>
              <p className="text-sm text-gray-500 mb-8">
                Remember your password?{' '}
                <Link href="/login" className="text-brand-green-700 font-medium hover:underline">
                  Sign in
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

                {serverError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {serverError}
                  </div>
                )}

                <Button type="submit" fullWidth loading={isSubmitting} size="lg">
                  Send reset link
                </Button>
              </form>

              <p className="mt-6 text-center">
                <Link href="/login" className="text-xs text-brand-green-700 hover:underline">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
