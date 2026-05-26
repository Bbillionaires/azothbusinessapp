// =============================================================================
// ImpactDashboard — local spending impact stats
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';

interface ImpactStats {
  localDollarsThisMonth: number;
  businessesSupported: number;
  localBusinessCount: number;
  communityOwnedCount: number;
  streakDays: number;
}

interface ImpactDashboardProps {
  stats: ImpactStats;
}

interface StatTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
}

function StatTile({ icon, iconColor, iconBg, label, value, sub }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
      {sub && <Text style={styles.tileSub}>{sub}</Text>}
    </View>
  );
}

export function ImpactDashboard({ stats }: ImpactDashboardProps) {
  const dollarDisplay =
    stats.localDollarsThisMonth >= 1000
      ? `$${(stats.localDollarsThisMonth / 1000).toFixed(1)}K`
      : `$${stats.localDollarsThisMonth.toFixed(0)}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Your Local Impact</Text>
          <Text style={styles.subtitle}>This month's community contribution</Text>
        </View>
        <View style={styles.leafBadge}>
          <Ionicons name="leaf" size={16} color={Colors.textInverse} />
        </View>
      </View>

      {/* Hero metric */}
      <View style={styles.heroContainer}>
        <Ionicons name="storefront" size={24} color={Colors.gold} />
        <Text style={styles.heroValue}>{dollarDisplay}</Text>
        <Text style={styles.heroLabel}>spent at local businesses</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.grid}>
        <StatTile
          icon="business"
          iconColor={Colors.primary}
          iconBg={Colors.primaryBg}
          label="Businesses"
          value={String(stats.businessesSupported)}
          sub="supported"
        />
        <StatTile
          icon="people"
          iconColor="#7B341E"
          iconBg="#FFF5F0"
          label="Community"
          value={String(stats.communityOwnedCount)}
          sub="owned biz"
        />
        <StatTile
          icon="flame"
          iconColor="#E53E3E"
          iconBg="#FFF5F5"
          label="Day Streak"
          value={String(stats.streakDays)}
          sub="keep it up!"
        />
      </View>

      {/* Local vs Community breakdown */}
      <View style={styles.breakdown}>
        <Text style={styles.breakdownTitle}>Business Mix</Text>
        <View style={styles.barContainer}>
          {stats.localBusinessCount > 0 && (
            <View
              style={[
                styles.barSegment,
                {
                  flex: stats.localBusinessCount,
                  backgroundColor: Colors.primaryMid,
                },
              ]}
            />
          )}
          {stats.communityOwnedCount > 0 && (
            <View
              style={[
                styles.barSegment,
                {
                  flex: stats.communityOwnedCount,
                  backgroundColor: Colors.gold,
                },
              ]}
            />
          )}
          {stats.businessesSupported - stats.localBusinessCount - stats.communityOwnedCount > 0 && (
            <View
              style={[
                styles.barSegment,
                {
                  flex: Math.max(
                    0,
                    stats.businessesSupported -
                      stats.localBusinessCount -
                      stats.communityOwnedCount
                  ),
                  backgroundColor: Colors.border,
                },
              ]}
            />
          )}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primaryMid }]} />
            <Text style={styles.legendText}>{stats.localBusinessCount} Local</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.gold }]} />
            <Text style={styles.legendText}>{stats.communityOwnedCount} Community</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    gap: Spacing.xl,
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    gap: 2,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  leafBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  heroContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  heroValue: {
    fontSize: FontSize.hero + 4,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
  },
  heroLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tileValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
  },
  tileLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FontWeight.medium,
  },
  tileSub: {
    fontSize: FontSize.xxs,
    color: 'rgba(255,255,255,0.55)',
  },

  // Breakdown
  breakdown: {
    gap: Spacing.sm,
  },
  breakdownTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  barContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
    gap: 2,
  },
  barSegment: {
    borderRadius: Radius.full,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
});
