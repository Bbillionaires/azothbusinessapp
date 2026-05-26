'use client';

import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TopBarProps {
  title?: string;
  onMenuToggle?: () => void;
  actions?: React.ReactNode;
}

export function TopBar({ title, onMenuToggle, actions }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-white border-b border-gray-200 px-4 md:px-6 py-3">
      {/* Left side */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {title && (
          <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-500 w-48">
          <Search className="h-4 w-4 shrink-0" />
          <span>Search…</span>
        </div>

        {/* Actions slot */}
        {actions}

        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="sm" className="p-2 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-gold-400 rounded-full border border-white" />
          </Button>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-brand-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
          B
        </div>
      </div>
    </header>
  );
}
