'use client';

import React from 'react';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const value = `${String(hours).padStart(2, '0')}:${minutes}`;
  return { value, label: `${displayHour}:${minutes} ${period}` };
});

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface HoursEditorProps {
  value: Record<string, DayHours>;
  onChange: (hours: Record<string, DayHours>) => void;
}

export function HoursEditor({ value, onChange }: HoursEditorProps) {
  const hours = DAYS.reduce<Record<string, DayHours>>((acc, day) => {
    acc[day.key] = value?.[day.key] ?? { open: '09:00', close: '17:00', closed: false };
    return acc;
  }, {});

  function updateDay(dayKey: string, updates: Partial<DayHours>) {
    onChange({ ...hours, [dayKey]: { ...hours[dayKey], ...updates } });
  }

  return (
    <div className="space-y-2">
      {DAYS.map(({ key, label }) => {
        const day = hours[key];
        return (
          <div
            key={key}
            className={[
              'flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors',
              day.closed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-gray-300',
            ].join(' ')}
          >
            {/* Day label */}
            <span className="w-28 text-sm font-medium text-gray-700 shrink-0">{label}</span>

            {/* Closed toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={day.closed}
                onChange={(e) => updateDay(key, { closed: e.target.checked })}
                className="accent-brand-green-700 w-4 h-4"
              />
              <span className="text-xs text-gray-500">Closed</span>
            </label>

            {/* Time pickers */}
            {!day.closed && (
              <div className="flex items-center gap-2 flex-1">
                <select
                  value={day.open}
                  onChange={(e) => updateDay(key, { open: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-green-600"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <span className="text-gray-400 text-xs shrink-0">to</span>
                <select
                  value={day.close}
                  onChange={(e) => updateDay(key, { close: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-green-600"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {day.closed && (
              <span className="text-xs text-gray-400 italic">Closed all day</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
