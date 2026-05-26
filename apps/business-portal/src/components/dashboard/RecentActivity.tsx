'use client';

import React from 'react';
import { Star, UserPlus, Calendar, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityItem } from '@/hooks/useAnalytics';

const iconMap = {
  review: { Icon: Star, bg: 'bg-amber-100', color: 'text-amber-600' },
  follower: { Icon: UserPlus, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  rsvp: { Icon: Calendar, bg: 'bg-blue-100', color: 'text-blue-600' },
  view: { Icon: Eye, bg: 'bg-purple-100', color: 'text-purple-600' },
};

interface RecentActivityProps {
  items: ActivityItem[];
  loading?: boolean;
}

export function RecentActivity({ items, loading = false }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-xs text-gray-500 mt-0.5">Latest interactions with your business</p>
      </div>

      <div className="divide-y divide-gray-50">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))
          : items.length === 0
          ? (
              <div className="px-5 py-12 text-center text-gray-500 text-sm">
                No recent activity yet.
              </div>
            )
          : items.map((item) => {
              const { Icon, bg, color } = iconMap[item.type] ?? iconMap.view;
              return (
                <div key={item.id} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full ${bg} ${color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{item.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
