'use client';

import { useState } from 'react';
import RoleGuard from '@/components/layout/RoleGuard';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminTopBar from '@/components/layout/AdminTopBar';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/receipts': 'Receipt Review Queue',
  '/businesses': 'Businesses',
  '/users': 'Users',
  '/verification': 'Verification Requests',
  '/disputes': 'Disputes',
  '/rewards': 'Rewards Catalog',
  '/advertising': 'Advertising',
  '/legends': 'Community Legends',
  '/analytics': 'Analytics',
  '/fraud': 'Fraud Dashboard',
  '/notifications': 'Notifications',
  '/exports': 'Data Exports',
  '/audit': 'Audit Logs',
  '/settings': 'System Settings',
};

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Determine page title from pathname
  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? 'Admin Portal';

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar collapsed={sidebarCollapsed} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminTopBar
          title={title}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </RoleGuard>
  );
}
