'use client';

import React from 'react';
import { BusinessProfileForm } from '@/components/profile/BusinessProfileForm';
import { BadgeDisplay } from '@/components/profile/BadgeDisplay';
import { useBusiness } from '@/hooks/useBusiness';

export default function ProfilePage() {
  const { business, loading, updateBusiness } = useBusiness();

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="section-card">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Business Profile</h1>
          <p className="page-subtitle">
            Keep your information up-to-date so customers can find and trust you.
          </p>
        </div>
        <BadgeDisplay tier={business?.verification_tier ?? null} size="md" />
      </div>

      {/* Profile completeness bar */}
      {business && (
        <div className="mb-6 section-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Profile Completeness
            </span>
            <span className="text-sm font-bold text-brand-green-700">
              {business.profile_completeness ?? 0}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-green-600 rounded-full transition-all duration-500"
              style={{ width: `${business.profile_completeness ?? 0}%` }}
            />
          </div>
          {(business.profile_completeness ?? 0) < 100 && (
            <p className="text-xs text-gray-500 mt-1.5">
              Fill in all sections below to reach 100% and unlock more visibility.
            </p>
          )}
        </div>
      )}

      <div className="section-card">
        <BusinessProfileForm
          business={business}
          onSubmit={updateBusiness}
        />
      </div>
    </div>
  );
}
