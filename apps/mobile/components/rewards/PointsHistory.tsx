// =============================================================================
// PointsHistory — list of point transactions
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Colors, Spacing, FontSize, FontWeight } from '../../lib/theme';
import type { PointsTransaction } from '../../../../packages/shared/src/types/rewards';

const TX_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  receipt_approved:    { icon: 'receipt-outline',    color: Colors.success },
  reward_redemption:   { icon: 'gift-outline',        color: Colors.error },
  signup_bonus:        { icon: 'person-add-outline',  color: Colors.primary },
  referral:            { icon: 'people-outline',      color: Colors.primaryMid },
  review:              { icon: 'star-outline',         color: Colors.gold },
  event_attendance:    { icon: 'calendar-outline',    color: Colors.info },
  birthday_bonus:      { icon: 'balloon-outline',     color: Colors.gold },
  streak_bonus:        { icon: 'flame-outline',       color: '#E53E3E' },
  admin_adjustment:    { icon: 'settings-outline',    color: Colors.textTertiary },
  expiry:              { icon: 'time-outline',        color: Colors.textTertiary },
};

interface PointsHistoryProps {
  transactions: PointsTransaction[];
  isLoading?: boolean;
}

export function PointsHistory({ transactions, isLoading }: PointsHistoryProps) {
  if (isLoading) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Loading history...</Text>
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="star-outline" size={40} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>No transactions yet</Text>
        <Text style={styles.emptySubtext}>Scan your first receipt to earn points!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => {
        const isEarning = item.amount > 0;
        const iconConfig = TX_ICONS[item.type] ?? {
          icon: 'star-outline' as keyof typeof Ionicons.glyphMap,
          color: Colors.textTertiary,
        };

        return (
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: `${iconConfig.color}18` }]}>
              <Ionicons name={iconConfig.icon} size={18} color={iconConfig.color} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.txLabel} numberOfLines={1}>
                {item.description ?? item.type.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.txDate}>
                {format(new Date(item.created_at), 'MMM d, yyyy')}
              </Text>
            </View>
            <View style={styles.deltaContainer}>
              <Text style={[styles.delta, isEarning ? styles.deltaPositive : styles.deltaNegative]}>
                {isEarning ? '+' : ''}
                {item.amount.toLocaleString()}
              </Text>
              <Text style={styles.balance}>{item.balance_after.toLocaleString()} pts</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  txLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  txDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  deltaContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  delta: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  deltaPositive: {
    color: Colors.success,
  },
  deltaNegative: {
    color: Colors.error,
  },
  balance: {
    fontSize: FontSize.xxs,
    color: Colors.textTertiary,
  },
});
