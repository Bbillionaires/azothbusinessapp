// =============================================================================
// BusinessCard — list and map sheet card
// =============================================================================

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';
import { BusinessBadges } from './BusinessBadges';
import type { BusinessCard as BusinessCardType } from '../../../../packages/shared/src/types/business';

const CATEGORY_LABELS: Record<string, string> = {
  food_drink: 'Food & Drink',
  retail: 'Retail',
  services: 'Services',
  health_wellness: 'Health & Wellness',
  beauty: 'Beauty',
  automotive: 'Automotive',
  home_garden: 'Home & Garden',
  entertainment: 'Entertainment',
  education: 'Education',
  nonprofit: 'Nonprofit',
  professional: 'Professional',
  technology: 'Technology',
  real_estate: 'Real Estate',
  financial: 'Financial',
  childcare: 'Childcare',
  fitness: 'Fitness',
  arts_crafts: 'Arts & Crafts',
  pet_services: 'Pet Services',
  travel: 'Travel',
  other: 'Other',
};

interface BusinessCardProps {
  business: BusinessCardType;
  onPress?: () => void;
  compact?: boolean;
}

export function BusinessCard({ business, onPress, compact = false }: BusinessCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/business/${business.id}`);
    }
  };

  const rating = business.average_rating;
  const categoryLabel = CATEGORY_LABELS[business.category] ?? business.category;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={[styles.container, compact && styles.compactContainer]}
    >
      {/* Cover Image */}
      <View style={[styles.imageContainer, compact && styles.compactImage]}>
        {business.cover_url || business.logo_url ? (
          <Image
            source={{ uri: business.cover_url ?? business.logo_url ?? '' }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="business-outline" size={32} color={Colors.textTertiary} />
          </View>
        )}
        {/* Logo overlay */}
        {business.logo_url && business.cover_url && (
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: business.logo_url }}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {business.name}
            </Text>
            {business.is_featured && (
              <Ionicons name="star" size={14} color={Colors.gold} style={styles.featuredIcon} />
            )}
          </View>
          <Text style={styles.category}>{categoryLabel}</Text>
        </View>

        {/* Badges */}
        <BusinessBadges business={business} compact scrollable />

        {/* Footer */}
        <View style={styles.footer}>
          {rating !== null && rating !== undefined && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color={Colors.gold} />
              <Text style={styles.rating}>{rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({business.total_reviews})</Text>
            </View>
          )}
          {business.distance_miles !== undefined && (
            <View style={styles.distanceRow}>
              <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
              <Text style={styles.distance}>
                {business.distance_miles < 0.1
                  ? 'Nearby'
                  : `${business.distance_miles.toFixed(1)} mi`}
              </Text>
            </View>
          )}
          {business.city && (
            <Text style={styles.location}>
              {business.city}
              {business.state ? `, ${business.state}` : ''}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.md,
    marginBottom: Spacing.md,
  },
  compactContainer: {
    width: 200,
    marginBottom: 0,
    marginRight: Spacing.md,
  },
  imageContainer: {
    height: 140,
    backgroundColor: Colors.surfaceAlt,
  },
  compactImage: {
    height: 110,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
  },
  logoContainer: {
    position: 'absolute',
    bottom: -16,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    padding: 2,
    ...Shadows.sm,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.xs,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.sm,
  },
  header: {
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  featuredIcon: {},
  category: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  reviewCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distance: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  location: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
});
