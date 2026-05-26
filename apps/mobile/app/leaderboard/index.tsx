// =============================================================================
// Full Leaderboard Screen
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../../components/ui/Avatar';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows, TierColors } from '../../lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LeaderboardTab = 'spending' | 'referrals' | 'reviews' | 'impact';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  rank: number;
  score: number | null;
  period_type: string;
  leaderboard_type: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
    legend_tier: string | null;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS: { key: LeaderboardTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'spending',  label: 'Spending',  icon: 'cash-outline' },
  { key: 'referrals', label: 'Referrals', icon: 'people-outline' },
  { key: 'reviews',   label: 'Reviews',   icon: 'star-outline' },
  { key: 'impact',    label: 'Impact',    icon: 'trending-up-outline' },
];

const RANK_MEDALS: Record<number, { emoji: string; bg: string; border: string }> = {
  1: { emoji: '🥇', bg: '#FFFBEB', border: '#D4AF37' },
  2: { emoji: '🥈', bg: '#F5F5F5', border: '#A0AEC0' },
  3: { emoji: '🥉', bg: '#FDF0E8', border: '#CD7F32' },
};

const SCORE_LABELS: Record<LeaderboardTab, string> = {
  spending:  'pts',
  referrals: 'refs',
  reviews:   'reviews',
  impact:    'impact',
};

function formatScore(score: number | null, tab: LeaderboardTab): string {
  if (score == null) return '—';
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`;
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}K`;
  return score.toLocaleString();
}

function maskName(displayName: string | null | undefined): string {
  if (!displayName) return 'Anonymous';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

interface EntryRowProps {
  entry: LeaderboardEntry;
  activeTab: LeaderboardTab;
  isCurrentUser: boolean;
}

function EntryRow({ entry, activeTab, isCurrentUser }: EntryRowProps) {
  const medal = RANK_MEDALS[entry.rank];
  const tier = entry.profiles?.legend_tier ?? 'bronze';
  const tierInfo = TierColors[tier] ?? TierColors.bronze;
  const name = maskName(entry.profiles?.display_name);

  if (medal) {
    return (
      <View style={[styles.medalRow, { backgroundColor: medal.bg, borderColor: medal.border }]}>
        <Text style={styles.medalEmoji}>{medal.emoji}</Text>
        <Avatar
          uri={entry.profiles?.avatar_url}
          name={name}
          size={40}
          borderColor={medal.border}
          borderWidth={2}
        />
        <View style={styles.entryInfo}>
          <Text style={styles.entryName} numberOfLines={1}>{name}</Text>
          <View style={[styles.tierPill, { backgroundColor: tierInfo.bg }]}>
            <Text style={[styles.tierPillText, { color: tierInfo.color }]}>
              {tierInfo.emoji} {tierInfo.label}
            </Text>
          </View>
        </View>
        <View style={styles.scoreWrap}>
          <Text style={styles.scoreValue}>{formatScore(entry.score, activeTab)}</Text>
          <Text style={styles.scoreLabel}>{SCORE_LABELS[activeTab]}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.entryRow, isCurrentUser && styles.entryRowHighlight]}>
      <Text style={styles.rankNumber}>#{entry.rank}</Text>
      <Avatar uri={entry.profiles?.avatar_url} name={name} size={36} />
      <View style={styles.entryInfo}>
        <Text style={[styles.entryName, isCurrentUser && styles.entryNameHighlight]} numberOfLines={1}>
          {name}{isCurrentUser ? ' (You)' : ''}
        </Text>
        <Text style={styles.tierLabel}>{tierInfo.emoji} {tierInfo.label}</Text>
      </View>
      <View style={styles.scoreWrap}>
        <Text style={[styles.scoreValue, isCurrentUser && styles.scoreValueHighlight]}>
          {formatScore(entry.score, activeTab)}
        </Text>
        <Text style={styles.scoreLabel}>{SCORE_LABELS[activeTab]}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<LeaderboardTab>('spending');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async (tab: LeaderboardTab) => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('*, profiles(display_name, avatar_url, legend_tier)')
        .eq('period_type', 'monthly')
        .eq('leaderboard_type', tab)
        .order('rank', { ascending: true })
        .limit(50);

      if (!error && data) {
        setEntries(data as LeaderboardEntry[]);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchLeaderboard(activeTab).finally(() => setIsLoading(false));
  }, [activeTab, fetchLeaderboard]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard(activeTab);
    setRefreshing(false);
  };

  const currentUserEntry = user?.id ? entries.find((e) => e.user_id === user.id) : undefined;

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => (
    <EntryRow
      entry={item}
      activeTab={activeTab}
      isCurrentUser={item.user_id === user?.id}
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Ionicons name="trophy" size={22} color={Colors.gold} />
          <Text style={styles.headerText}>Leaderboard</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? Colors.primary : Colors.textTertiary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period label */}
      <View style={styles.periodRow}>
        <Ionicons name="calendar-outline" size={14} color={Colors.textTertiary} />
        <Text style={styles.periodText}>Monthly Rankings · May 2026</Text>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      ) : (
        <FlashList
          data={entries}
          estimatedItemSize={64}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No data yet</Text>
              <Text style={styles.emptyText}>
                Rankings for this category will appear once enough activity has been recorded.
              </Text>
            </View>
          }
          ListFooterComponent={
            /* Current user's position pinned at bottom if not in top list */
            currentUserEntry && entries.indexOf(currentUserEntry) < 0 ? (
              <View style={styles.userFooter}>
                <View style={styles.userFooterDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Your Position</Text>
                  <View style={styles.dividerLine} />
                </View>
                <EntryRow
                  entry={currentUserEntry}
                  activeTab={activeTab}
                  isCurrentUser
                />
              </View>
            ) : null
          }
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerText: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textInverse },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: 3,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.xxs, fontWeight: FontWeight.semibold, color: Colors.textTertiary },
  tabTextActive: { color: Colors.primary },

  // Period
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryBg,
  },
  periodText: { fontSize: FontSize.xs, color: Colors.textTertiary },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.huge,
  },

  // Medal row (top 3)
  medalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  medalEmoji: { fontSize: 24, width: 28, textAlign: 'center' },

  // Regular entry row
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  entryRowHighlight: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  rankNumber: {
    width: 32,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  entryInfo: { flex: 1, gap: 2 },
  entryName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  entryNameHighlight: { color: Colors.primary },
  tierLabel: { fontSize: FontSize.xxs, color: Colors.textTertiary },
  tierPill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  tierPillText: { fontSize: FontSize.xxs, fontWeight: FontWeight.semibold },
  scoreWrap: { alignItems: 'flex-end', gap: 1 },
  scoreValue: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  scoreValueHighlight: { color: Colors.primary },
  scoreLabel: { fontSize: FontSize.xxs, color: Colors.textTertiary },

  // States
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.base, color: Colors.textSecondary },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.massive,
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.base, color: Colors.textTertiary, textAlign: 'center', lineHeight: 22 },

  // User footer
  userFooter: {
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  userFooterDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.semibold },
});
