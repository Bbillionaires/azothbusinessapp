'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from './RoleGuard';
import { getNavItems, ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
import type { AdminRole } from '@/lib/supabase';
import {
  LayoutDashboard,
  Receipt,
  Building2,
  MessageSquareWarning,
  Users,
  BadgeCheck,
  Gift,
  Megaphone,
  Star,
  BarChart3,
  ShieldAlert,
  ScrollText,
  Settings,
  ChevronRight,
  Leaf,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Receipt,
  Building2,
  MessageSquareWarning,
  Users,
  BadgeCheck,
  Gift,
  Megaphone,
  Star,
  BarChart3,
  ShieldAlert,
  ScrollText,
  Settings,
};

// Nav group labels
const SECTION_BREAKS: Record<string, string> = {
  '/dashboard': 'Overview',
  '/users': 'Management',
  '/fraud': 'Security',
};

interface AdminSidebarProps {
  collapsed?: boolean;
}

export default function AdminSidebar({ collapsed = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const { profile, role } = useAdminAuth();

  if (!role) return null;

  const navItems = getNavItems(role as AdminRole);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside
      className={`
        flex flex-col h-full bg-[#1E293B] border-r border-slate-700/50
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="flex items-center justify-center w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg shrink-0">
          <Leaf className="w-4 h-4 text-green-400" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">Admin Portal</p>
            <p className="text-xs text-slate-500 truncate">Local First Rewards™</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item, idx) => {
          const Icon = ICON_MAP[item.icon];
          const active = isActive(item.href);
          const sectionLabel = SECTION_BREAKS[item.href];

          return (
            <div key={item.href}>
              {/* Section break label */}
              {sectionLabel && !collapsed && idx > 0 && (
                <div className="px-3 pt-4 pb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    {sectionLabel}
                  </p>
                </div>
              )}

              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors group relative
                  ${active
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                {Icon && (
                  <Icon
                    className={`w-4 h-4 shrink-0 ${active ? 'text-green-400' : 'text-slate-400 group-hover:text-slate-200'}`}
                  />
                )}

                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && <ChevronRight className="w-3 h-3 text-green-400 shrink-0" />}
                  </>
                )}

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-slate-100 text-xs rounded
                                  opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap
                                  border border-slate-700 shadow-lg transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User profile footer */}
      {profile && (
        <div className={`border-t border-slate-700/50 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? '' : 'w-full'}`}>
            <div className="flex items-center justify-center w-8 h-8 bg-slate-600 rounded-full shrink-0 text-xs font-semibold text-slate-100">
              {profile.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-100 truncate">{profile.full_name}</p>
                <span
                  className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border mt-0.5 ${ROLE_COLORS[role as AdminRole]}`}
                >
                  {ROLE_LABELS[role as AdminRole]}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
