'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, MapPin, Users, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  rsvps: number;
  status: 'upcoming' | 'ongoing' | 'past';
  free: boolean;
  price?: number;
}

const DEMO_EVENTS: Event[] = [
  { id: '1', title: 'Community Block Party', description: 'Annual neighborhood celebration with live music, food, and fun for all ages.', date: '2026-06-15', time: '12:00', location: '123 Main St, Downtown', capacity: 500, rsvps: 234, status: 'upcoming', free: true },
  { id: '2', title: 'Business Networking Mixer', description: 'Connect with other local business owners and community leaders.', date: '2026-06-05', time: '18:00', location: '456 Commerce Ave', capacity: 80, rsvps: 72, status: 'upcoming', free: false, price: 15 },
  { id: '3', title: 'Spring Sale Kickoff', description: 'Exclusive discounts and giveaways for our loyal customers.', date: '2026-05-01', time: '10:00', location: 'In-store', capacity: 200, rsvps: 156, status: 'past', free: true },
];

const statusBadge = {
  upcoming: 'bg-blue-100 text-blue-700 border-blue-200',
  ongoing: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  past: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(DEMO_EVENTS);

  function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="page-container">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Create and manage events to engage your community.</p>
        </div>
        <Link href="/events/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Event</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="section-card flex flex-col items-center py-16 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No events yet</p>
          <p className="text-sm text-gray-400 mb-4">Post your first event to drive foot traffic and engagement.</p>
          <Link href="/events/new">
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>Create Event</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {events.map((event) => {
            const capacityPct = Math.round((event.rsvps / event.capacity) * 100);
            return (
              <div key={event.id} className="section-card hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{event.description}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusBadge[event.status]}`}>
                    {event.status}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {format(new Date(event.date), 'MMMM d, yyyy')} at {event.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {event.rsvps} / {event.capacity} RSVPs
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Capacity</span>
                    <span className="font-medium">{capacityPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 70 ? 'bg-amber-500' : 'bg-brand-green-600'}`}
                      style={{ width: `${Math.min(capacityPct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${event.free ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {event.free ? 'Free' : `$${event.price?.toFixed(2)}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteEvent(event.id)} className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
