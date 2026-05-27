// =============================================================================
// ReceiptStatus — status badge and detail row for a receipt
// =============================================================================

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../lib/theme';
import type { ReceiptWithBusiness } from '../../../../packages/shared/src/types/receipt';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    color: Colors.warning,
    bg: Colors.warningBg,
    icon: 'time-outline' as const,
  },
  approved: {
    label: 'Approved',
    color: Colors.success,
    bg: Colors.successBg,
    icon: 'checkmark-circle-outline' as const,
  },
  rejected: {
    label: 'Rejected',
    color: Colors.error,
    bg: Colors.errorBg,
    icon: 'close-circle-outline' as const,
  },
  duplicate: {
    label: 'Duplicate',
    color: Colors.textTertiary,
    bg: Colors.surfaceAlt,
    icon: 'copy-outline' as const,
  },
  flagged: {
    label: 'Flagged',
    color: Colors.error,
    bg: Colors.errorBg,
    icon: 'flag-outline' as const,
  },
  suspicious: {
    label: 'Under Review',
    color: Colors.error,
    bg: Colors.errorBg,
    icon: 'alert-circle-outline' as const,
  },
  resubmission_requested: {
    label: 'Resubmit Required',
    color: Colors.warning,
    bg: Colors.warningBg,
    icon: 'refresh-circle-outline' as const,
  },
};

interface ReceiptStatusProps {
  receipt: ReceiptWithBusiness;
  onPress?: () => void;
}

export function ReceiptStatus({ receipt, onPress }: ReceiptStatusProps) {
  const config = STATUS_CONFIG[receipt.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const business = (receipt as any).businesses;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      style={styles.container}
    >
      {/* Thumbnail */}
      {receipt.image_url ? (
        <Image source={{ uri: receipt.image_url }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Ionicons name="receipt-outline" size={20} color={Colors.textTertiary} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.businessName} numberOfLines={1}>
          {business?.name ?? 'Unknown Business'}
        </Text>
        <Text style={styles.date}>
          {format(new Date(receipt.created_at), 'MMM d, yyyy')}
        </Text>
        {(receipt as any).total != null && (
          <Text style={styles.amount}>${Number((receipt as any).total).toFixed(2)}</Text>
        )}
      </View>

      {/* Right side: status + points */}
      <View style={styles.right}>
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={12} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
        {receipt.points_awarded !== null && receipt.points_awarded !== undefined && receipt.points_awarded > 0 && (
          <View style={styles.pointsRow}>
            <Ionicons name="star" size={11} color={Colors.gold} />
            <Text style={styles.points}>+{receipt.points_awarded}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    flexShrink: 0,
  },
  thumbnailPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  businessName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  amount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  points: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
});
