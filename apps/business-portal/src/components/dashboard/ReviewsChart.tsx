'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ChartDataPoint } from '@/hooks/useAnalytics';

interface ReviewsChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-gray-600">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="capitalize">{entry.name}:</span>
          <span className="font-medium text-gray-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function ReviewsChart({ data, loading = false }: ReviewsChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-gray-900">Performance Overview</h3>
          <p className="text-xs text-gray-500 mt-0.5">Views, followers & reviews — last 6 months</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1B4332" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#1B4332" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
            formatter={(value) => <span className="capitalize text-gray-600">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="#1B4332"
            strokeWidth={2}
            fill="url(#colorViews)"
            dot={false}
            activeDot={{ r: 4, fill: '#1B4332' }}
          />
          <Area
            type="monotone"
            dataKey="followers"
            stroke="#D4AF37"
            strokeWidth={2}
            fill="url(#colorFollowers)"
            dot={false}
            activeDot={{ r: 4, fill: '#D4AF37' }}
          />
          <Area
            type="monotone"
            dataKey="reviews"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#colorReviews)"
            dot={false}
            activeDot={{ r: 4, fill: '#3B82F6' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
