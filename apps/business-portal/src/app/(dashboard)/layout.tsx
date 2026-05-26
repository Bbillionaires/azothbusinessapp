'use client';

import React, { Suspense, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { TopBar } from '@/components/layout/TopBar';
import { useBusiness } from '@/hooks/useBusiness';
import { ToastProvider } from '@/components/ui/Toast';
import DashboardGroupLoading from './loading';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { business } = useBusiness();

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-20">
          <Sidebar
            businessName={business?.name}
            verificationTier={business?.verification_tier ?? null}
          />
        </aside>

        {/* Mobile navigation drawer */}
        <MobileNav
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          businessName={business?.name}
          verificationTier={business?.verification_tier ?? null}
        />

        {/* Main content area */}
        <div className="flex-1 lg:ml-64 flex flex-col overflow-hidden">
          <TopBar onMenuToggle={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <Suspense fallback={<DashboardGroupLoading />}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
