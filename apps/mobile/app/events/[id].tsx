import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { THEME } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const EVENT_TYPE_ICONS: Record<string, string> = {
  popup: '🎪', workshop: '🛠️', sale: '🏷️', performance: '🎵',
  community: '🤝', grand_opening: '🎊', food: '🍽️', networking: '👥',
  fundraiser: '🏛', vendor_market: '🎪', other: '📅',
};

interface EventData {
  id: string;
  title: string;
  type: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  image_url: string | null;
  is_free: boolean;
  ticket_price: number | null;
  max_attendees: number | null;
  attendee_count: number;
  points_reward: number;
  businesses: { id: string; name: string } | null;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<'none' | 'going' | 'interested'>('none');
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('events')
        .select('*, businesses(id, name)')
        .eq('id', id as string)
        .single();
      if (data) setEvent(data as EventData);

      if (user && data) {
        const { data: rsvp } = await supabase
          .from('event_rsvps')
          .select('status')
          .eq('event_id', id as string)
          .eq('user_id', user.id)
          .maybeSingle();
        if (rsvp) setRsvpStatus(rsvp.status as 'going' | 'interested');
      }
      setLoading(false);
    }
    load();
  }, [id, user]);

  const handleRSVP = async (status: 'going' | 'interested') => {
    if (!user || !event) return;
    setToggling(true);
    const newStatus = rsvpStatus === status ? 'none' : status;
    if (newStatus === 'none') {
      await supabase.from('event_rsvps').delete().eq('event_id', event.id).eq('user_id', user.id);
    } else {
      await supabase.from('event_rsvps').upsert({
        event_id: event.id, user_id: user.id, status: newStatus,
      }, { onConflict: 'event_id,user_id' });
    }
    setRsvpStatus(newStatus);
    setToggling(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}><ActivityIndicator size="large" color="#1B4332" /></View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backBtnPlain} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={THEME.colors.text} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Event not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const attendancePct = event.max_attendees ? Math.min(100, (event.attendee_count / event.max_attendees) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header image */}
        <View style={styles.coverContainer}>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Text style={styles.coverEmoji}>{EVENT_TYPE_ICONS[event.type] ?? '📅'}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {EVENT_TYPE_ICONS[event.type]} {event.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{event.title}</Text>
          {event.businesses && (
            <Text style={styles.organizer}>by {event.businesses.name}</Text>
          )}

          {/* Points reward */}
          {event.points_reward > 0 && (
            <View style={styles.pointsBanner}>
              <Text style={styles.pointsIcon}>🎯</Text>
              <Text style={styles.pointsText}>Earn {event.points_reward} points for attending</Text>
            </View>
          )}

          {/* Event details */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color={THEME.colors.primary} />
              <View>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(event.start_at), 'EEEE, MMMM d, yyyy')}
                </Text>
                <Text style={styles.detailValue}>
                  {format(new Date(event.start_at), 'h:mm a')}
                  {event.end_at ? ` – ${format(new Date(event.end_at), 'h:mm a')}` : ''}
                </Text>
              </View>
            </View>

            {(event.address || event.city) && (
              <View style={[styles.detailRow, styles.detailBorder]}>
                <Ionicons name="location-outline" size={20} color={THEME.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Location</Text>
                  {event.address && <Text style={styles.detailValue}>{event.address}</Text>}
                  {event.city && (
                    <Text style={styles.detailValue}>{event.city}{event.state ? `, ${event.state}` : ''}</Text>
                  )}
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`maps:?q=${encodeURIComponent(`${event.address ?? ''}, ${event.city ?? ''}, ${event.state ?? ''}`)}`)}
                  >
                    <Text style={styles.directionsLink}>Get Directions →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={[styles.detailRow, styles.detailBorder]}>
              <Ionicons name="ticket-outline" size={20} color={THEME.colors.primary} />
              <View>
                <Text style={styles.detailLabel}>Admission</Text>
                <Text style={styles.detailValue}>
                  {event.is_free ? '🎁 Free Entry' : event.ticket_price ? `$${event.ticket_price}` : 'See details'}
                </Text>
              </View>
            </View>

            {event.max_attendees && (
              <View style={[styles.detailRow, styles.detailBorder]}>
                <Ionicons name="people-outline" size={20} color={THEME.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Attendance</Text>
                  <Text style={styles.detailValue}>{event.attendee_count} / {event.max_attendees} going</Text>
                  <View style={styles.attendanceBar}>
                    <View style={[styles.attendanceFill, { width: `${attendancePct}%` as any }]} />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>About this Event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          {/* RSVP buttons */}
          <View style={styles.rsvpSection}>
            <TouchableOpacity
              style={[styles.rsvpBtn, rsvpStatus === 'going' && styles.rsvpBtnActive]}
              onPress={() => handleRSVP('going')}
              disabled={toggling}
            >
              <Ionicons
                name={rsvpStatus === 'going' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={20}
                color={rsvpStatus === 'going' ? '#fff' : THEME.colors.primary}
              />
              <Text style={[styles.rsvpBtnText, rsvpStatus === 'going' && styles.rsvpBtnTextActive]}>
                {rsvpStatus === 'going' ? "I'm Going!" : "I'm Going"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rsvpBtnSecondary, rsvpStatus === 'interested' && styles.rsvpBtnSecondaryActive]}
              onPress={() => handleRSVP('interested')}
              disabled={toggling}
            >
              <Ionicons name="star-outline" size={20} color={rsvpStatus === 'interested' ? THEME.colors.gold : THEME.colors.textSecondary} />
              <Text style={[styles.rsvpBtnSecondaryText, rsvpStatus === 'interested' && { color: THEME.colors.gold }]}>
                Interested
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: THEME.colors.textSecondary },
  backBtnPlain: { padding: 16 },
  coverContainer: { position: 'relative', height: 220 },
  coverImage: { width: '100%', height: 220 },
  coverPlaceholder: { backgroundColor: THEME.colors.primary, alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 72 },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  typeBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  body: { padding: 16, gap: 16 },
  title: { fontSize: 24, fontWeight: '800', color: THEME.colors.text },
  organizer: { fontSize: 14, color: THEME.colors.textSecondary, marginTop: -8 },
  pointsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: THEME.colors.primaryLight, borderRadius: 10, padding: 12,
  },
  pointsIcon: { fontSize: 20 },
  pointsText: { color: THEME.colors.primary, fontWeight: '700', fontSize: 14 },
  detailsCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  detailBorder: { borderTopWidth: 1, borderTopColor: THEME.colors.border },
  detailLabel: { fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 2 },
  detailValue: { fontSize: 14, color: THEME.colors.text, fontWeight: '500' },
  directionsLink: { color: THEME.colors.primary, fontWeight: '600', marginTop: 4, fontSize: 13 },
  attendanceBar: {
    width: '100%', height: 4, backgroundColor: THEME.colors.border,
    borderRadius: 2, marginTop: 6, overflow: 'hidden',
  },
  attendanceFill: { height: '100%', backgroundColor: THEME.colors.primary, borderRadius: 2 },
  descSection: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.colors.text },
  description: { fontSize: 15, color: THEME.colors.text, lineHeight: 22 },
  rsvpSection: { flexDirection: 'row', gap: 10, paddingBottom: 32 },
  rsvpBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, padding: 14, gap: 6, borderWidth: 1.5,
    borderColor: THEME.colors.primary, backgroundColor: '#fff',
  },
  rsvpBtnActive: { backgroundColor: THEME.colors.primary },
  rsvpBtnText: { fontWeight: '700', fontSize: 15, color: THEME.colors.primary },
  rsvpBtnTextActive: { color: '#fff' },
  rsvpBtnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, padding: 14, gap: 6, borderWidth: 1.5,
    borderColor: THEME.colors.border, backgroundColor: '#fff',
  },
  rsvpBtnSecondaryActive: { borderColor: THEME.colors.gold },
  rsvpBtnSecondaryText: { fontWeight: '700', fontSize: 15, color: THEME.colors.textSecondary },
});
