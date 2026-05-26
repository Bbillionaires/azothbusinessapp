import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

type Legend = {
  id: string;
  user_id: string;
  tier: string;
  total_impact_score: number;
  is_permanent: boolean;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  hall_of_legends: { label: 'Hall of Legends', color: '#7C3AED', bg: '#F3E8FF', emoji: '👑' },
  legend: { label: 'Legend', color: '#7C3AED', bg: '#EDE9FE', emoji: '⭐' },
  platinum: { label: 'Platinum', color: '#64748B', bg: '#F1F5F9', emoji: '💎' },
  gold: { label: 'Gold', color: '#92400E', bg: '#FEF3C7', emoji: '🥇' },
  silver: { label: 'Silver', color: '#475569', bg: '#F8FAFC', emoji: '🥈' },
  bronze: { label: 'Bronze', color: '#92400E', bg: '#FEF9EE', emoji: '🥉' },
};

const TIER_ORDER = ['hall_of_legends', 'legend', 'platinum', 'gold', 'silver', 'bronze'];

function maskName(name: string | null): string {
  if (!name) return 'Anonymous';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export default function LegendsScreen() {
  const { user, profile } = useAuthStore();
  const [legends, setLegends] = useState<Legend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchLegends() {
    const { data } = await supabase
      .from('community_legends')
      .select('*, profiles(display_name, avatar_url)')
      .order('tier', { ascending: false })
      .order('total_impact_score', { ascending: false });
    if (data) setLegends(data as Legend[]);
    setLoading(false);
  }

  useEffect(() => { fetchLegends(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLegends();
    setRefreshing(false);
  };

  const hallOfLegends = legends.filter(l => l.tier === 'hall_of_legends');
  const grouped = TIER_ORDER.slice(1).map(tier => ({
    tier,
    entries: legends.filter(l => l.tier === tier),
  })).filter(g => g.entries.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Community Legends™</Text>
          <Text style={styles.subtitle}>These champions have permanently earned their place in history</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#7C3AED" />
          </View>
        ) : (
          <>
            {/* Hall of Legends horizontal scroll */}
            {hallOfLegends.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👑 Hall of Legends</Text>
                <Text style={styles.sectionSubtitle}>Permanently enshrined — these legends can never be removed</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hallScroll}>
                  {hallOfLegends.map(legend => (
                    <View key={legend.id} style={styles.hallCard}>
                      <View style={styles.hallAvatar}>
                        {legend.profiles?.avatar_url ? (
                          <Image source={{ uri: legend.profiles.avatar_url }} style={styles.hallAvatarImage} />
                        ) : (
                          <Text style={styles.hallAvatarText}>{maskName(legend.profiles?.display_name)[0]}</Text>
                        )}
                      </View>
                      <View style={styles.crownOverlay}>
                        <Text style={styles.crownEmoji}>👑</Text>
                      </View>
                      <Text style={styles.hallName} numberOfLines={1}>{maskName(legend.profiles?.display_name)}</Text>
                      <Text style={styles.hallScore}>{legend.total_impact_score?.toLocaleString() ?? '0'} pts</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Tier groups */}
            {grouped.map(({ tier, entries }) => {
              const config = TIER_CONFIG[tier];
              return (
                <View key={tier} style={styles.section}>
                  <Text style={styles.sectionTitle}>{config.emoji} {config.label}</Text>
                  <View style={styles.tierList}>
                    {entries.map(legend => (
                      <View key={legend.id} style={[styles.legendRow, { borderLeftColor: config.color }]}>
                        <View style={[styles.legendAvatar, { backgroundColor: config.bg }]}>
                          {legend.profiles?.avatar_url ? (
                            <Image source={{ uri: legend.profiles.avatar_url }} style={styles.legendAvatarImage} />
                          ) : (
                            <Text style={[styles.legendAvatarText, { color: config.color }]}>
                              {maskName(legend.profiles?.display_name)[0]}
                            </Text>
                          )}
                        </View>
                        <View style={styles.legendInfo}>
                          <Text style={styles.legendName}>{maskName(legend.profiles?.display_name)}</Text>
                          <Text style={styles.legendMeta}>
                            Since {new Date(legend.created_at).getFullYear()}
                            {legend.is_permanent ? ' · Permanent' : ''}
                          </Text>
                        </View>
                        <View style={[styles.tierBadge, { backgroundColor: config.bg }]}>
                          <Text style={[styles.tierBadgeText, { color: config.color }]}>
                            {legend.total_impact_score?.toLocaleString() ?? '0'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}

            {legends.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🌟</Text>
                <Text style={styles.emptyTitle}>No Legends Yet</Text>
                <Text style={styles.emptyText}>Be the first to reach Legend status by shopping local and supporting your community!</Text>
              </View>
            )}

            {/* Your Journey */}
            {user && profile && (
              <View style={styles.yourJourney}>
                <Text style={styles.journeyTitle}>Your Journey</Text>
                <View style={styles.journeyRow}>
                  <Text style={styles.journeyLabel}>Current Tier</Text>
                  <View style={[styles.journeyBadge, { backgroundColor: TIER_CONFIG[profile.legend_tier ?? 'bronze']?.bg ?? '#FEF9EE' }]}>
                    <Text style={[styles.journeyBadgeText, { color: TIER_CONFIG[profile.legend_tier ?? 'bronze']?.color ?? '#92400E' }]}>
                      {TIER_CONFIG[profile.legend_tier ?? 'bronze']?.emoji} {TIER_CONFIG[profile.legend_tier ?? 'bronze']?.label ?? 'Not Ranked'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.journeyHint}>Keep shopping local to climb the ranks!</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 4, lineHeight: 18 },
  centered: { paddingTop: 60, alignItems: 'center' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#888', marginBottom: 12 },
  hallScroll: { gap: 12, paddingRight: 16 },
  hallCard: { width: 100, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E9D5FF', shadowColor: '#7C3AED', shadowOpacity: 0.1, shadowRadius: 6, elevation: 2, position: 'relative' },
  hallAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#7C3AED', marginBottom: 4 },
  hallAvatarImage: { width: 56, height: 56, borderRadius: 28 },
  hallAvatarText: { fontSize: 22, fontWeight: '800', color: '#7C3AED' },
  crownOverlay: { position: 'absolute', top: 6, right: 6 },
  crownEmoji: { fontSize: 14 },
  hallName: { fontSize: 11, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  hallScore: { fontSize: 10, color: '#7C3AED', marginTop: 2, fontWeight: '600' },
  tierList: { gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderWidth: 1, borderColor: '#F3F4F6' },
  legendAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  legendAvatarImage: { width: 40, height: 40, borderRadius: 20 },
  legendAvatarText: { fontSize: 16, fontWeight: '700' },
  legendInfo: { flex: 1 },
  legendName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  legendMeta: { fontSize: 11, color: '#888', marginTop: 2 },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tierBadgeText: { fontSize: 12, fontWeight: '700' },
  emptyState: { paddingVertical: 48, alignItems: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  yourJourney: { marginHorizontal: 16, marginBottom: 32, padding: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  journeyTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  journeyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  journeyLabel: { fontSize: 13, color: '#666' },
  journeyBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  journeyBadgeText: { fontSize: 12, fontWeight: '700' },
  journeyHint: { fontSize: 12, color: '#888', fontStyle: 'italic' },
});
