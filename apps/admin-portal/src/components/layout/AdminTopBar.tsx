'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAdminAuth } from './RoleGuard';
import { ROLE_LABELS } from '@/lib/permissions';
import type { AdminRole } from '@/lib/supabase';
import {
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Menu,
  X,
  User,
} from 'lucide-react';

interface AdminTopBarProps {
  title: string;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export default function AdminTopBar({ title, onToggleSidebar, sidebarCollapsed }: AdminTopBarProps) {
  const router = useRouter();
  const { profile, role } = useAdminAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const supabase = createSupabaseBrowserClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  // Mock notifications count — replace with real data
  const notifCount = 3;

  return (
    <header className="h-16 bg-[#1E293B] border-b border-slate-700/50 flex items-center gap-4 px-6 shrink-0">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </button>

      {/* Page title */}
      <h1 className="text-base font-semibold text-slate-100 flex-1">{title}</h1>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 w-64">
        <Search className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="Search…"
          className="bg-transparent text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none w-full"
        />
        <kbd className="hidden lg:block text-[10px] text-slate-600 bg-slate-700/50 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {notifCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl z-50">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <p className="text-sm font-semibold text-slate-100">Notifications</p>
            </div>
            <div className="divide-y divide-slate-700/30 max-h-72 overflow-y-auto">
              {[
                { title: '5 receipts pending review', time: '2 min ago', type: 'info' },
                { title: 'High fraud score detected', time: '15 min ago', type: 'warning' },
                { title: 'New business verification request', time: '1 hr ago', type: 'info' },
              ].map((n, i) => (
                <div key={i} className="px-4 py-3 hover:bg-slate-700/30 transition-colors cursor-pointer">
                  <p className="text-sm text-slate-200">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.time}</p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-slate-700/50">
              <button className="text-xs text-green-400 hover:text-green-300 transition-colors">
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
          className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
        >
          <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-xs font-semibold text-green-400">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-slate-100 leading-tight">
              {profile?.full_name ?? 'Admin'}
            </p>
            <p className="text-xs text-slate-500">
              {role ? ROLE_LABELS[role as AdminRole] : ''}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl z-50">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <p className="text-sm font-medium text-slate-100 truncate">{profile?.email}</p>
            </div>
            <div className="p-1.5">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 transition-colors">
                <User className="w-4 h-4" />
                My Profile
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for menus */}
      {(userMenuOpen || notifOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setUserMenuOpen(false); setNotifOpen(false); }}
        />
      )}
    </header>
  );
}
