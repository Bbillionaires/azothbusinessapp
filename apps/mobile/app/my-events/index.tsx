import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Radius, FontSize } from '../../lib/theme';

interface MyEvent {
  id: string;
  status: string;
  created_at: string;
  event: {
    id: string;
    title: string;
    event_type: string;
    start_at: string;
    end_at: string | null;
    city: string;
    current_attendees: number;
    max_attendees: number | null;
    business: {
      id: string;
      name: string;
    } | null;
  };
}

const TYPE_EMOJI: Record<string, string> = {
  vendor_market: '🏪',
  art_walk: '🎨',
  food_truck: '🚚',
  community: '🏘️',
  grand_opening: '🎉',
  networking: '🤝',
  workshop: '📚',
  fundraiser: '💝',
  other: '📅',
};

export default function MyEventsScreen() {
  const { user } = useAuthStore();
  const [rsvps, setRsvps] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('event_rsvps')
        .select(`
          id, status, created_at,
          event:events(
            id, title, event_type, start_at, end_at, city, current_attendees, max_attendees,
            business:businesses(id, name)
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      setRsvps((data ?? []) as MyEvent[]);
      setLoading(false);
    }
    load();
  }, [user]);

  const now = new Date();
  const filtered = rsvps.filter(r => {
    const eventDate = new Date(r.event.start_at);
    return filter === 'upcoming' ? eventDate >= now : eventDate < now;
  });

  const handleCancelRsvp = async (rsvpId: string) => {
    await supabase.from('event_rsvps').delete().eq('id', rsvpId);
    setRsvps(prev => prev.filter(r => r.id !== rsvpId));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>My Events</Text>
      </View>

      <View style={styles.filterRow}>
        {(['upcoming', 'past'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f === 'upcoming' ? 'Upcoming' : 'Past'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>
            No {filter} events
          </Text>
          <Text style={styles.emptyText}>
            {filter === 'upcoming'
              ? 'RSVP to local events to see them here.'
              : 'Events you attended will appear here.'}
          </Text>
          {filter === 'upcoming' && (
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/events')}>
              <Text style={styles.browseBtnText}>Browse Events</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const eventDate = new Date(item.event.start_at);
            const isPast = eventDate < now;
            const emoji = TYPE_EMOJI[item.event.event_type] ?? '📅';
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/events/${item.event.id}`)}
              >
                <View style={styles.emojiContainer}>
                  <Text style={styles.emoji}>{emoji}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.eventTitle}>{item.event.title}</Text>
                  {item.event.business && (
                    <Text style={styles.businessName}>{item.event.business.name}</Text>
                  )}
                  <Text style={styles.eventMeta}>
                    {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}
                    {eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.locationText}>{item.event.city}</Text>
                </View>
                {!isPast && (
                  <TouchableOpacity onPress={() => handleCancelRsvp(item.id)} style={styles.cancelBtn}>
                    <Ionicons name="close-circle-outline" size={22} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  filterRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  filterBtnTextActive: { color: '#fff' },
  loader: { marginTop: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  browseBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 24, paddingVertical: 12, marginTop: Spacing.sm },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  cardInfo: { flex: 1 },
  eventTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  businessName: { fontSize: FontSize.sm, color: Colors.primary, marginTop: 2, fontWeight: '600' },
  eventMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  locationText: { fontSize: FontSize.xs ?? 11, color: Colors.textSecondary, marginTop: 2 },
  cancelBtn: { padding: 6 },
});
