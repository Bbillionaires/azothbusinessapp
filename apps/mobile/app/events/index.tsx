import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

type Event = {
  id: string; title: string; description: string | null; type: string;
  start_at: string; end_at: string | null; address: string | null;
  city: string | null; is_free: boolean; points_reward: number;
  current_attendees: number; max_attendees: number | null;
  businesses: { name: string; city: string } | null;
};

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  popup: { label: 'Pop-Up', color: '#7C3AED', bg: '#F3E8FF', icon: '🎪' },
  workshop: { label: 'Workshop', color: '#0284C7', bg: '#E0F2FE', icon: '🛠️' },
  sale: { label: 'Sale', color: '#DC2626', bg: '#FEE2E2', icon: '🏷️' },
  performance: { label: 'Performance', color: '#D97706', bg: '#FEF3C7', icon: '🎵' },
  community: { label: 'Community', color: '#059669', bg: '#D1FAE5', icon: '🤝' },
  grand_opening: { label: 'Grand Opening', color: '#1B4332', bg: '#DCFCE7', icon: '🎊' },
  food: { label: 'Food Event', color: '#EA580C', bg: '#FFEDD5', icon: '🍽️' },
  networking: { label: 'Networking', color: '#0284C7', bg: '#DBEAFE', icon: '👥' },
  other: { label: 'Event', color: '#6B7280', bg: '#F3F4F6', icon: '📅' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'free', label: 'Free' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
];

function formatEventDate(startsAt: string): string {
  const d = new Date(startsAt);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatEventTime(startsAt: string): string {
  return new Date(startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [rsvpdIds, setRsvpdIds] = useState<Set<string>>(new Set());

  const fetchEvents = useCallback(async () => {
    const now = new Date().toISOString();
    let query = supabase
      .from('events')
      .select('*, businesses(name, city)')
      .eq('status', 'published')
      .gte('start_at', now)
      .order('start_at', { ascending: true })
      .limit(30);

    if (filter === 'free') query = query.eq('is_free', true);
    if (filter === 'this_week') {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      query = query.lte('start_at', weekEnd.toISOString());
    }
    if (filter === 'this_month') {
      const monthEnd = new Date();
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      query = query.lte('start_at', monthEnd.toISOString());
    }

    const { data } = await query;
    if (data) setEvents(data as Event[]);

    // Fetch user's RSVPs
    if (user) {
      const eventIds = (data ?? []).map(e => e.id);
      if (eventIds.length > 0) {
        const { data: rsvps } = await supabase
          .from('event_rsvps')
          .select('event_id')
          .eq('user_id', user.id)
          .in('event_id', eventIds);
        if (rsvps) setRsvpdIds(new Set(rsvps.map(r => r.event_id)));
      }
    }
    setLoading(false);
  }, [filter, user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  async function toggleRSVP(eventId: string) {
    if (!user) return;
    const isRsvpd = rsvpdIds.has(eventId);
    if (isRsvpd) {
      await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id);
      setRsvpdIds(prev => { const s = new Set(prev); s.delete(eventId); return s; });
    } else {
      await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: user.id, status: 'going' });
      setRsvpdIds(prev => new Set([...prev, eventId]));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Upcoming Events</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTERS.map(f => (
          <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.filterChip, filter === f.key && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#1B4332" /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B4332" />}
          contentContainerStyle={styles.list}
        >
          {events.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyTitle}>No Upcoming Events</Text>
              <Text style={styles.emptyText}>Local businesses will be posting events soon. Check back!</Text>
            </View>
          ) : events.map(event => {
            const config = EVENT_TYPE_CONFIG[event.type] ?? EVENT_TYPE_CONFIG.other;
            const isRsvpd = rsvpdIds.has(event.id);
            const isFull = event.max_attendees !== null && event.current_attendees >= event.max_attendees;

            return (
              <Pressable key={event.id} onPress={() => router.push(`/events/${event.id}`)} style={styles.card}>
                {/* Date stripe */}
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeDate}>{formatEventDate(event.start_at)}</Text>
                  <Text style={styles.dateBadgeTime}>{formatEventTime(event.start_at)}</Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
                      <Text style={styles.typeEmoji}>{config.icon}</Text>
                      <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
                    </View>
                    {event.is_free && <View style={styles.freeBadge}><Text style={styles.freeText}>FREE</Text></View>}
                    {event.points_reward > 0 && (
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>+{event.points_reward} pts</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                  <Text style={styles.bizName}>{event.businesses?.name}</Text>

                  {(event.address || event.city) && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color="#888" />
                      <Text style={styles.locationText}>{event.address ?? event.city}</Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.attendeeRow}>
                      <Ionicons name="people-outline" size={14} color="#888" />
                      <Text style={styles.attendeeText}>
                        {event.current_attendees} going
                        {event.max_attendees ? ` · ${event.max_attendees - event.current_attendees} spots left` : ''}
                      </Text>
                    </View>
                    <Pressable
                      onPress={(e) => { e.stopPropagation(); toggleRSVP(event.id); }}
                      style={[styles.rsvpBtn, isRsvpd && styles.rsvpBtnActive, isFull && styles.rsvpBtnFull]}
                      disabled={isFull && !isRsvpd}
                    >
                      <Text style={[styles.rsvpText, isRsvpd && styles.rsvpTextActive]}>
                        {isFull && !isRsvpd ? 'Full' : isRsvpd ? '✓ Going' : 'RSVP'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  header: { backgroundColor: '#1B4332', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  filterScroll: { maxHeight: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  filterContent: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  list: { padding: 16, gap: 12 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row' },
  dateBadge: { width: 64, backgroundColor: '#1B4332', justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
  dateBadgeDate: { color: '#D4AF37', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  dateBadgeTime: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4, textAlign: 'center' },
  cardBody: { flex: 1, padding: 12 },
  cardTop: { flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  typeEmoji: { fontSize: 10 },
  typeLabel: { fontSize: 10, fontWeight: '700' },
  freeBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  freeText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  pointsBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  pointsText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  bizName: { fontSize: 12, color: '#1B4332', fontWeight: '600', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  locationText: { fontSize: 11, color: '#888', flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeeText: { fontSize: 11, color: '#888' },
  rsvpBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#1B4332' },
  rsvpBtnActive: { backgroundColor: '#1B4332' },
  rsvpBtnFull: { borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' },
  rsvpText: { fontSize: 12, fontWeight: '700', color: '#1B4332' },
  rsvpTextActive: { color: '#fff' },
});
