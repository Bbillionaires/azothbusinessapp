'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  align?: 'left' | 'right';
}

const VARIANT_STYLES = {
  default: 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50',
  danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
  warning: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10',
};

export default function ActionMenu({ items, align = 'right' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div
          className={`
            absolute top-full mt-1 w-44 bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl z-50
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          <div className="p-1.5 space-y-0.5">
            {items.map((item, idx) => {
              const Icon = item.icon;
              const variantStyles = VARIANT_STYLES[item.variant ?? 'default'];
              return (
                <button
                  key={idx}
                  onClick={() => { item.onClick(); setOpen(false); }}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left
                    ${variantStyles}
                    disabled:opacity-40 disabled:cursor-not-allowed
                  `}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
