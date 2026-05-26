// =============================================================================
// FeaturedBusinesses — horizontal scroll of featured business cards
// =============================================================================

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, FontWeight } from '../../lib/theme';
import { BusinessCard } from '../business/BusinessCard';
import type { BusinessCard as BusinessCardType } from '../../../../packages/shared/src/types/business';

interface FeaturedBusinessesProps {
  businesses: BusinessCardType[];
  title?: string;
  isLoading?: boolean;
}

function SkeletonCard() {
  return (
    <View style={styles.skeleton}>
      <View style={styles.skeletonImg} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '60%' }]} />
      </View>
    </View>
  );
}

export function FeaturedBusinesses({
  businesses,
  title = 'Featured Businesses',
  isLoading = false,
}: FeaturedBusinessesProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text
          style={styles.seeAll}
          onPress={() => router.push('/(tabs)/')}
        >
          See All
        </Text>
      </View>

      {isLoading ? (
        <FlatList
          horizontal
          data={[1, 2, 3]}
          keyExtractor={(item) => String(item)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={() => <SkeletonCard />}
        />
      ) : businesses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No featured businesses nearby.</Text>
        </View>
      ) : (
        <FlatList
          horizontal
          data={businesses}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <BusinessCard
              business={item}
              compact
              onPress={() => router.push(`/business/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },

  // Skeleton
  skeleton: {
    width: 200,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  skeletonImg: {
    height: 110,
    backgroundColor: Colors.surfaceAlt,
  },
  skeletonContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 6,
  },

  empty: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
});
