// =============================================================================
// BusinessBadges — ownership and trust badges row
// =============================================================================

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Badge } from '../ui/Badge';
import type { BusinessCard } from '../../../../packages/shared/src/types/business';

interface BusinessBadgesProps {
  business: Pick<
    BusinessCard,
    | 'is_local_owned'
    | 'is_community_owned'
    | 'is_veteran_owned'
    | 'is_woman_owned'
    | 'verification_level'
    | 'hiring_now'
    | 'has_free_today'
    | 'has_upcoming_event'
  >;
  scrollable?: boolean;
  compact?: boolean;
}

export function BusinessBadges({ business, scrollable = false, compact = false }: BusinessBadgesProps) {
  const badges: Array<{ label: string; variant: 'primary' | 'gold' | 'success' | 'warning' | 'neutral' }> = [];

  if (business.is_community_owned) badges.push({ label: 'Community Owned', variant: 'primary' });
  if (business.is_local_owned) badges.push({ label: 'Local Owned', variant: 'primary' });
  if (business.is_veteran_owned) badges.push({ label: 'Veteran Owned', variant: 'neutral' });
  if (business.is_woman_owned) badges.push({ label: 'Woman Owned', variant: 'neutral' });

  if (business.verification_level === 'elite') badges.push({ label: 'Elite Verified', variant: 'gold' });
  else if (business.verification_level === 'pro') badges.push({ label: 'Pro Verified', variant: 'gold' });
  else if (business.verification_level === 'community_trusted') badges.push({ label: 'Community Trusted', variant: 'success' });
  else if (business.verification_level === 'basic') badges.push({ label: 'Verified', variant: 'success' });

  if (business.hiring_now) badges.push({ label: 'Hiring Now', variant: 'warning' });
  if (business.has_free_today) badges.push({ label: 'Free Today', variant: 'success' });
  if (business.has_upcoming_event) badges.push({ label: 'Event', variant: 'primary' });

  if (badges.length === 0) return null;

  const content = (
    <View style={[styles.row, scrollable && styles.scrollRow]}>
      {badges.map((b, i) => (
        <Badge
          key={b.label}
          label={b.label}
          variant={b.variant}
          small={compact}
          {...(i < badges.length - 1 ? { style: styles.badgeSpacing } : {})}
        />
      ))}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={styles.wrap}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollRow: {
    flexWrap: 'nowrap',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeSpacing: {
    marginRight: 6,
  },
  scrollContent: {
    paddingRight: 16,
  },
});
