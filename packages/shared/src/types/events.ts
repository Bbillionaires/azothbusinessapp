// =============================================================================
// Events Types
// =============================================================================

export type EventType =
  | 'vendor_market'
  | 'art_walk'
  | 'food_truck'
  | 'community'
  | 'grand_opening'
  | 'networking'
  | 'workshop'
  | 'fundraiser'
  | 'other';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export type RsvpStatus = 'going' | 'interested' | 'cancelled';

// ---------------------------------------------------------------------------
// Event — mirrors public.events
// ---------------------------------------------------------------------------
export interface Event {
  id: string;
  business_id: string | null;
  organizer_id: string;

  title: string;
  description: string | null;
  type: EventType;
  tags: string[];

  // Timing
  start_at: string;             // ISO 8601 datetime
  end_at: string | null;
  timezone: string;
  is_recurring: boolean;
  recurrence_rule: string | null;

  // Location
  venue_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  is_online: boolean;
  online_url: string | null;

  // Media
  image_url: string | null;
  gallery_urls: string[];

  // Capacity
  max_attendees: number | null;
  current_attendees: number;

  // Pricing & incentives
  is_free: boolean;
  price: number | null;
  points_reward: number;

  // Status
  status: EventStatus;
  is_featured: boolean;
  flagged: boolean;

  created_at: string;
  updated_at: string;
}

export type EventInsert = Omit<
  Event,
  | 'id'
  | 'current_attendees'
  | 'is_featured'
  | 'flagged'
  | 'created_at'
  | 'updated_at'
> & {
  id?: string;
  current_attendees?: number;
  is_featured?: boolean;
  flagged?: boolean;
};

export type EventUpdate = Partial<
  Omit<Event, 'id' | 'organizer_id' | 'current_attendees' | 'created_at' | 'updated_at'>
>;

// ---------------------------------------------------------------------------
// Event RSVP — mirrors public.event_rsvps
// ---------------------------------------------------------------------------
export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  check_in_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Composite types for UI
// ---------------------------------------------------------------------------
export interface EventWithOrganizer extends Event {
  organizer: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  user_rsvp?: EventRsvp | null;
}

export interface EventCard
  extends Pick<
    Event,
    | 'id'
    | 'title'
    | 'type'
    | 'start_at'
    | 'end_at'
    | 'city'
    | 'state'
    | 'image_url'
    | 'is_free'
    | 'price'
    | 'current_attendees'
    | 'max_attendees'
    | 'points_reward'
    | 'status'
    | 'is_featured'
  > {
  organizer_name?: string | null;
  business_name?: string | null;
  is_sold_out?: boolean;
}

// ---------------------------------------------------------------------------
// Event type display config
// ---------------------------------------------------------------------------
export interface EventTypeConfig {
  type: EventType;
  label: string;
  emoji: string;
  color: string;
}
