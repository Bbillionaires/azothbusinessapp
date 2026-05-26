// =============================================================================
// LeaderboardCard — preview of the local leaderboard
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';
import { Avatar } from '../ui/Avatar';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  totalPoints: number;
  tier: string;
}

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  onViewAll?: () => void;
}

const RANK_ICONS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function LeaderboardCard({ entries, currentUserRank, onViewAll }: LeaderboardCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={18} color={Colors.gold} />
          <Text style={styles.title}>Local Leaderboard</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {entries.slice(0, 5).map((entry, index) => (
        <View key={entry.userId} style={[styles.row, index === 0 && styles.topRow]}>
          <View style={styles.rankContainer}>
            {entry.rank <= 3 ? (
              <Text style={styles.rankEmoji}>{RANK_ICONS[entry.rank]}</Text>
            ) : (
              <Text style={styles.rankNumber}>#{entry.rank}</Text>
            )}
          </View>
          <Avatar uri={entry.avatarUrl} name={entry.displayName} size={36} />
          <View style={styles.entryContent}>
            <Text style={styles.entryName} numberOfLines={1}>
              {entry.displayName}
            </Text>
          </View>
          <View style={styles.pointsContainer}>
            <Ionicons name="star" size={12} color={Colors.gold} />
            <Text style={styles.points}>
              {entry.totalPoints >= 1000
                ? `${(entry.totalPoints / 1000).toFixed(1)}K`
                : entry.totalPoints.toLocaleString()}
            </Text>
          </View>
        </View>
      ))}

      {currentUserRank !== undefined && currentUserRank > 5 && (
        <View style={styles.userRankRow}>
          <Text style={styles.userRankLabel}>Your rank</Text>
          <Text style={styles.userRankValue}>#{currentUserRank}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    gap: Spacing.md,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  viewAll: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  topRow: {
    backgroundColor: Colors.goldBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginHorizontal: -Spacing.md,
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
  },
  rankEmoji: {
    fontSize: 18,
  },
  rankNumber: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
  },
  entryContent: {
    flex: 1,
  },
  entryName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  points: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  userRankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  userRankLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  userRankValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});
