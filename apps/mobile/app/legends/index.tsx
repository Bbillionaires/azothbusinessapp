// =============================================================================
// Community Legends Wall Screen
// =============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../../components/ui/Avatar';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommunityLegend {
  id: string;
  user_id: string;
  tier: string;
  impact_score: number | null;
  is_permanent: boolean;
  inducted_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// ---------------------------------------------------------------------------
// Tier config — per spec colors
// ---------------------------------------------------------------------------

const TIER_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  border: string;
  emoji: string;
  order: number;
}> = {
  hall_of_legends: { label: 'Hall of Legends', color: '#7C3AED', bg: '#F3E8FF', border: '#DDD6FE', emoji: '👑', order: 0 },
  legend:          { label: 'Legend',           color: '#7C3AED', bg: '#EDE9FE', border: '#C4B5FD', emoji: '⭐', order: 1 },
  platinum:        { label: 'Platinum',          color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1', emoji: '💎', order: 2 },
  gold:            { label: 'Gold',              color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', emoji: '🥇', order: 3 },
  silver:          { label: 'Silver',            color: '#475569', bg: '#F8FAFC', border: '#E2E8F0', emoji: '🥈', order: 4 },
  bronze:          { label: 'Bronze',            color: '#92400E', bg: '#FEF9EE', border: '#FDE68A', emoji: '🥉', order: 5 },
};

const TIER_ORDER = ['hall_of_legends', 'legend', 'platinum', 'gold', 'silver', 'bronze'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskName(name: string | null | undefined): string {
  if (!name) return 'Anonymous';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function formatScore(score: number | null | undefined): string {
  if (!score) return '0';
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`;
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}K`;
  return score.toLocaleString();
}

function memberSinceYear(createdAt: string): string {
  return new Date(createdAt).getFullYear().toString();
}

// ---------------------------------------------------------------------------
// Hall of Legends card
// ---------------------------------------------------------------------------

interface HallCardProps {
  legend: CommunityLegend;
}

function HallCard({ legend }: HallCardProps) {
  const name = maskName(legend.profiles?.full_name);
  return (
    <View style={styles.hallCard}>
      <View style={styles.hallAvatarWrap}>
        <Avatar
          uri={legend.profiles?.avatar_url}
          name={name}
          size={60}
          borderColor="#7C3AED"
          borderWidth={2.5}
        />
        <View style={styles.crownBadge}>
          <Text style={styles.crownEmoji}>👑</Text>
        </View>
      </View>
      <Text style={styles.hallName} numberOfLines={1}>{name}</Text>
      <Text style={styles.hallScore}>{formatScore(legend.impact_score)} pts</Text>
      <Text style={styles.hallSince}>Since {memberSinceYear(legend.inducted_at)}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Legend row (in tier groups)
// ---------------------------------------------------------------------------

interface LegendRowProps {
  legend: CommunityLegend;
}

function LegendRow({ legend }: LegendRowProps) {
  const config = TIER_CONFIG[legend.tier] ?? TIER_CONFIG.bronze;
  const name = maskName(legend.profiles?.full_name);

  return (
    <View style={[styles.legendRow, { borderLeftColor: config.color }]}>
      <Avatar uri={legend.profiles?.avatar_url} name={name} size={44} />
      <View style={styles.legendInfo}>
        <Text style={styles.legendName} numberOfLines={1}>{name}</Text>
        <Text style={styles.legendMeta}>
          Member since {memberSinceYear(legend.inducted_at)}
          {legend.is_permanent ? ' · Permanent' : ''}
        </Text>
      </View>
      <View style={styles.legendRight}>
        <View style={[styles.tierBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
          <Text style={[styles.tierBadgeText, { color: config.color }]}>
            {config.emoji} {config.label}
          </Text>
        </View>
        <Text style={[styles.legendScore, { color: config.color }]}>
          {formatScore(legend.impact_score)} pts
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LegendsScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();

  const [legends, setLegends] = useState<CommunityLegend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLegends = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('community_legends')
        .select('*, profiles(full_name, avatar_url)')
        .order('tier', { ascending: false })
        .order('impact_score', { ascending: false });

      if (!error && data) {
        setLegends(data as CommunityLegend[]);
      }
    } catch (err) {
      console.error('Failed to fetch legends:', err);
    }
  }, []);

  useEffect(() => {
    fetchLegends().finally(() => setIsLoading(false));
  }, [fetchLegends]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLegends();
    setRefreshing(false);
  };

  const hallOfLegends = legends.filter((l) => l.tier === 'hall_of_legends');
  const grouped = TIER_ORDER.slice(1)
    .map((tier) => ({ tier, entries: legends.filter((l) => l.tier === tier) }))
    .filter((g) => g.entries.length > 0);

  // User's own legend entry (if they have one)
  const myLegend = user?.id ? legends.find((l) => l.user_id === user.id) : null;
  const userTier = myLegend?.tier ?? (profile as any)?.tier ?? 'bronze';
  const userConfig = TIER_CONFIG[userTier] ?? TIER_CONFIG.bronze;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#7C3AED"
            colors={['#7C3AED']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={Colors.textInverse} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Community Legends™</Text>
          <Text style={styles.headerSubtitle}>
            These champions have permanently earned their place in history
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading legends...</Text>
          </View>
        ) : (
          <>
            {/* Hall of Legends — horizontal scroll */}
            {hallOfLegends.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>👑 Hall of Legends</Text>
                  <View style={styles.permanentBadge}>
                    <Text style={styles.permanentBadgeText}>Permanent</Text>
                  </View>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Permanently enshrined — these legends can never be removed
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hallScroll}
                >
                  {hallOfLegends.map((legend) => (
                    <HallCard key={legend.id} legend={legend} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Tier groups */}
            {grouped.map(({ tier, entries }) => {
              const config = TIER_CONFIG[tier];
              return (
                <View key={tier} style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                      {config.emoji} {config.label}
                    </Text>
                    <View style={[styles.countBadge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.countBadgeText, { color: config.color }]}>
                        {entries.length}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.tierList}>
                    {entries.map((legend) => (
                      <LegendRow key={legend.id} legend={legend} />
                    ))}
                  </View>
                </View>
              );
            })}

            {/* Empty state */}
            {legends.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🌟</Text>
                <Text style={styles.emptyTitle}>No Legends Yet</Text>
                <Text style={styles.emptyText}>
                  Be the first to reach Legend status by shopping local and supporting your community!
                </Text>
              </View>
            )}

            {/* Your Journey */}
            <View style={styles.journeyCard}>
              <View style={styles.journeyHeader}>
                <Ionicons name="rocket-outline" size={20} color={Colors.primary} />
                <Text style={styles.journeyTitle}>Your Journey</Text>
              </View>

              <View style={styles.journeyCurrentRow}>
                <Text style={styles.journeyLabel}>Current Tier</Text>
                <View style={[styles.journeyTierBadge, { backgroundColor: userConfig.bg, borderColor: userConfig.border }]}>
                  <Text style={[styles.journeyTierText, { color: userConfig.color }]}>
                    {userConfig.emoji} {userConfig.label}
                  </Text>
                </View>
              </View>

              {myLegend ? (
                <View style={styles.journeyCurrentRow}>
                  <Text style={styles.journeyLabel}>Impact Score</Text>
                  <Text style={[styles.journeyScore, { color: userConfig.color }]}>
                    {formatScore(myLegend.impact_score)} pts
                  </Text>
                </View>
              ) : null}

              {/* Progress hint */}
              <View style={styles.progressHint}>
                {userTier === 'hall_of_legends' ? (
                  <Text style={styles.progressHintText}>
                    You have earned your permanent place in the Hall of Legends.
                  </Text>
                ) : userTier === 'legend' ? (
                  <Text style={styles.progressHintText}>
                    Incredible! You have reached Legend tier. Keep growing to earn permanent Hall of Legends status.
                  </Text>
                ) : (
                  <Text style={styles.progressHintText}>
                    Keep shopping local and supporting your community to climb the tier ladder toward Legend status.
                  </Text>
                )}
              </View>

              {/* Tier ladder preview */}
              <View style={styles.tierLadder}>
                {TIER_ORDER.slice(1).map((tier, i) => {
                  const cfg = TIER_CONFIG[tier];
                  const isCurrent = tier === userTier;
                  const isPast = TIER_CONFIG[tier].order < (TIER_CONFIG[userTier]?.order ?? 99);
                  return (
                    <View key={tier} style={styles.ladderItem}>
                      <View style={[
                        styles.ladderDot,
                        { backgroundColor: isCurrent ? cfg.color : isPast ? cfg.color : Colors.border },
                        isCurrent && styles.ladderDotActive,
                      ]}>
                        {isCurrent && <View style={styles.ladderDotInner} />}
                      </View>
                      {i < TIER_ORDER.length - 2 && (
                        <View style={[styles.ladderLine, { backgroundColor: isPast ? cfg.color : Colors.border }]} />
                      )}
                      <Text style={[
                        styles.ladderLabel,
                        { color: isCurrent ? cfg.color : isPast ? cfg.color : Colors.textTertiary },
                        isCurrent && styles.ladderLabelActive,
                      ]}>
                        {cfg.emoji}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerTopRow: { marginBottom: Spacing.md },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },

  // Loading
  loadingState: { paddingVertical: Spacing.massive, alignItems: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.base, color: Colors.textSecondary },

  // Section
  section: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  sectionSubtitle: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: Spacing.lg, lineHeight: 18 },
  permanentBadge: {
    backgroundColor: '#7C3AED' + '20',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  permanentBadgeText: { fontSize: FontSize.xxs, fontWeight: FontWeight.bold, color: '#7C3AED' },
  countBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  // Hall of Legends
  hallScroll: { paddingBottom: Spacing.sm, gap: Spacing.md, paddingRight: Spacing.xl },
  hallCard: {
    width: 108,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    ...Shadows.md,
    shadowColor: '#7C3AED',
  },
  hallAvatarWrap: { position: 'relative', marginBottom: Spacing.sm },
  crownBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  crownEmoji: { fontSize: 12 },
  hallName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  hallScore: { fontSize: FontSize.xxs, fontWeight: FontWeight.semibold, color: '#7C3AED' },
  hallSince: { fontSize: FontSize.xxs, color: Colors.textTertiary, marginTop: 1 },

  // Tier list
  tierList: { gap: Spacing.sm },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  legendInfo: { flex: 1, gap: 2 },
  legendName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  legendMeta: { fontSize: FontSize.xxs, color: Colors.textTertiary },
  legendRight: { alignItems: 'flex-end', gap: 3 },
  tierBadge: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  tierBadgeText: { fontSize: FontSize.xxs, fontWeight: FontWeight.bold },
  legendScore: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  // Empty
  emptyState: {
    paddingVertical: Spacing.massive,
    paddingHorizontal: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.base, color: Colors.textTertiary, textAlign: 'center', lineHeight: 22 },

  // Journey card
  journeyCard: {
    margin: Spacing.xl,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.huge,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.md,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  journeyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  journeyCurrentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  journeyLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  journeyTierBadge: {
    borderRadius: Radius.full,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  journeyTierText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  journeyScore: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  progressHint: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  progressHintText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Tier ladder
  tierLadder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    paddingTop: Spacing.sm,
  },
  ladderItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 0,
  },
  ladderDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ladderDotActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  ladderDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textInverse,
  },
  ladderLine: {
    width: 20,
    height: 2,
  },
  ladderLabel: {
    fontSize: 14,
    position: 'absolute',
    bottom: -22,
    left: -4,
  },
  ladderLabelActive: {
    fontSize: 16,
  },
});
