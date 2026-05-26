// =============================================================================
// RewardCard — individual reward catalog item
// =============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';
import type { RewardCatalogWithBusiness } from '../../../../packages/shared/src/types/rewards';

interface RewardCardProps {
  reward: RewardCatalogWithBusiness;
  userPoints: number;
  onRedeem: () => void;
}

const REWARD_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  discount: 'pricetag-outline',
  free_item: 'gift-outline',
  cashback: 'cash-outline',
  experience: 'star-outline',
  merchandise: 'bag-outline',
  donation: 'heart-outline',
};

export function RewardCard({ reward, userPoints, onRedeem }: RewardCardProps) {
  const canAfford = userPoints >= reward.points_cost;
  const iconName = REWARD_ICONS[reward.reward_type] ?? 'gift-outline';

  return (
    <View style={[styles.container, !canAfford && styles.containerDisabled]}>
      {/* Icon / Image */}
      <View style={styles.iconBox}>
        {reward.image_url ? (
          <Image source={{ uri: reward.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <Ionicons name={iconName} size={28} color={canAfford ? Colors.primary : Colors.textDisabled} />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {reward.name}
        </Text>
        {reward.description && (
          <Text style={styles.description} numberOfLines={2}>
            {reward.description}
          </Text>
        )}
        {reward.businesses && (
          <Text style={styles.businessName} numberOfLines={1}>
            {(reward as any).businesses?.name}
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.costRow}>
          <Ionicons name="star" size={14} color={Colors.gold} />
          <Text style={[styles.cost, !canAfford && styles.costDisabled]}>
            {reward.points_cost.toLocaleString()} pts
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRedeem}
          disabled={!canAfford}
          style={[styles.redeemBtn, !canAfford && styles.redeemBtnDisabled]}
          activeOpacity={0.8}
        >
          <Text style={[styles.redeemText, !canAfford && styles.redeemTextDisabled]}>
            {canAfford ? 'Redeem' : 'Not enough pts'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadows.md,
    overflow: 'hidden',
    flex: 1,
    minWidth: 160,
  },
  containerDisabled: {
    opacity: 0.7,
  },
  iconBox: {
    height: 90,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: Spacing.md,
    gap: 3,
    flex: 1,
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  description: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  businessName: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  footer: {
    padding: Spacing.md,
    paddingTop: 0,
    gap: Spacing.sm,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cost: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.goldDark,
  },
  costDisabled: {
    color: Colors.textDisabled,
  },
  redeemBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  redeemBtnDisabled: {
    backgroundColor: Colors.surfaceAlt,
  },
  redeemText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  redeemTextDisabled: {
    color: Colors.textDisabled,
  },
});
