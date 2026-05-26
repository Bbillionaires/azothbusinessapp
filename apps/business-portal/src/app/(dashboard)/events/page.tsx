'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Calendar, MapPin, Users, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { createBrowserClient } from '@supabase/ssr';

interface DBEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  address: string | null;
  city: string | null;
  max_attendees: number | null;
  current_attendees: number;
  is_free: boolean;
  price: number | null;
  status: string;
  type: string;
  points_reward: number;
}

function getEventStatus(event: DBEvent): { label: string; color: string } {
  const now = new Date();
  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : null;

  if (event.status === 'cancelled') return { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' };
  if (end && now > end) return { label: 'Past', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  if (now >= start && (!end || now <= end)) return { label: 'Ongoing', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700 border-blue-200' };
}

export default function EventsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      if (data) setBusinessId(data.id);
    }
    init();
  }, []);

  const loadEvents = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const res = await fetch(`/api/events?business_id=${businessId}`);
    const json = await res.json();
    setEvents(res.ok ? json : []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Create and manage events to engage your community.</p>
        </div>
        <Link
          href="/events/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          <Plus size={16} /> New Event
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-green-800" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Calendar size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 text-sm mb-6">Post your first event to drive foot traffic and community engagement.</p>
          <Link href="/events/new" className="px-4 py-2 bg-green-800 text-white rounded-lg font-semibold hover:bg-green-700 inline-flex items-center gap-2">
            <Plus size={16} /> Create Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {events.map(event => {
            const status = getEventStatus(event);
            const capacityPct = event.max_attendees
              ? Math.round((event.current_attendees / event.max_attendees) * 100)
              : null;
            return (
              <div key={event.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 shrink-0" />
                    {format(new Date(event.start_at), 'MMMM d, yyyy h:mm a')}
                  </div>
                  {event.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400 shrink-0" />
                      {event.address}{event.city ? `, ${event.city}` : ''}
                    </div>
                  )}
                  {event.max_attendees && (
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400 shrink-0" />
                      {event.current_attendees} / {event.max_attendees} RSVPs
                    </div>
                  )}
                </div>

                {capacityPct !== null && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Capacity</span>
                      <span className="font-medium">{capacityPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 70 ? 'bg-amber-500' : 'bg-green-700'}`}
                        style={{ width: `${Math.min(capacityPct, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${event.is_free ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {event.is_free ? 'Free' : `$${Number(event.price).toFixed(2)}`}
                    </span>
                    {event.points_reward > 0 && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-700">
                        +{event.points_reward} pts
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
