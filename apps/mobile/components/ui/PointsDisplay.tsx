// =============================================================================
// PointsDisplay — animated points counter pill
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../lib/theme';

interface PointsDisplayProps {
  points: number;
  variant?: 'hero' | 'compact' | 'pill';
  style?: ViewStyle;
  showIcon?: boolean;
  label?: string;
}

function formatPoints(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function PointsDisplay({
  points,
  variant = 'compact',
  style,
  showIcon = true,
  label = 'pts',
}: PointsDisplayProps) {
  if (variant === 'hero') {
    return (
      <View style={[styles.heroContainer, style]}>
        {showIcon && (
          <Ionicons name="star" size={28} color={Colors.gold} style={styles.heroIcon} />
        )}
        <Text style={styles.heroPoints}>{formatPoints(points)}</Text>
        <Text style={styles.heroLabel}>{label}</Text>
      </View>
    );
  }

  if (variant === 'pill') {
    return (
      <View style={[styles.pill, style]}>
        {showIcon && <Ionicons name="star" size={12} color={Colors.gold} style={styles.pillIcon} />}
        <Text style={styles.pillText}>
          {formatPoints(points)} {label}
        </Text>
      </View>
    );
  }

  // Compact default
  return (
    <View style={[styles.compact, style]}>
      {showIcon && <Ionicons name="star" size={14} color={Colors.gold} style={styles.compactIcon} />}
      <Text style={styles.compactPoints}>{formatPoints(points)}</Text>
      <Text style={styles.compactLabel}> {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Hero
  heroContainer: {
    alignItems: 'center',
  },
  heroIcon: {
    marginBottom: Spacing.xxs,
  },
  heroPoints: {
    fontSize: 52,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
    lineHeight: 60,
  },
  heroLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: 'rgba(255,255,255,0.8)',
    marginTop: -4,
  },

  // Pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.goldBg,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  pillIcon: {
    marginRight: 3,
  },
  pillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.goldDark,
  },

  // Compact
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIcon: {
    marginRight: 3,
  },
  compactPoints: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  compactLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
