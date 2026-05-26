'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Images,
  Tag,
  Calendar,
  Briefcase,
  Star,
  Share2,
  BarChart3,
  ShieldCheck,
  Megaphone,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Business Profile', href: '/profile', icon: Building2 },
  { label: 'Photos & Videos', href: '/photos', icon: Images },
  { label: 'Offers', href: '/offers', icon: Tag },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Reviews', href: '/reviews', icon: Star },
  { label: 'Referrals', href: '/referrals', icon: Share2 },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Verification', href: '/verification', icon: ShieldCheck },
  { label: 'Advertising', href: '/advertising', icon: Megaphone },
];

interface SidebarProps {
  businessName?: string;
  verificationTier?: string | null;
  onClose?: () => void;
}

export function Sidebar({ businessName, verificationTier, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="flex h-full flex-col bg-brand-green-700 text-white">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-brand-green-600">
        <div className="w-9 h-9 rounded-lg bg-brand-gold-400 flex items-center justify-center shrink-0">
          <span className="text-brand-green-900 font-black text-base leading-none">LF</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight truncate">Local First Rewards™</p>
          <p className="text-brand-green-300 text-xs truncate">Business Portal</p>
        </div>
      </div>

      {/* Business identity */}
      {businessName && (
        <div className="px-5 py-3 border-b border-brand-green-600">
          <p className="text-xs text-brand-green-300 font-medium uppercase tracking-wide mb-0.5">
            Managing
          </p>
          <p className="text-sm font-semibold text-white truncate">{businessName}</p>
          {verificationTier && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs text-brand-gold-400 font-medium">
              <ShieldCheck className="h-3 w-3" />
              {verificationTier}
            </span>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                    isActive
                      ? 'bg-brand-green-600 text-white'
                      : 'text-brand-green-100 hover:bg-brand-green-600/60 hover:text-white',
                  ].join(' ')}
                >
                  <Icon
                    className={[
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-brand-gold-400' : 'text-brand-green-300 group-hover:text-brand-gold-400',
                    ].join(' ')}
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="h-3 w-3 text-brand-green-300" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-brand-green-600 space-y-0.5">
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-green-100 hover:bg-brand-green-600/60 hover:text-white transition-colors group"
        >
          <Settings className="h-4 w-4 shrink-0 text-brand-green-300 group-hover:text-brand-gold-400" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-green-100 hover:bg-red-900/40 hover:text-red-200 transition-colors group"
        >
          <LogOut className="h-4 w-4 shrink-0 text-brand-green-300 group-hover:text-red-300" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
