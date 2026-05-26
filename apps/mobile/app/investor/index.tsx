// =============================================================================
// Investor Discovery Screen
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InvestmentType = 'All' | 'Funding' | 'Acquisition' | 'Partnership' | 'Franchise';

interface Business {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  verification_level: string | null;
  is_featured: boolean | null;
}

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------

const FILTER_TABS: InvestmentType[] = ['All', 'Funding', 'Acquisition', 'Partnership', 'Franchise'];

// Demo investment type assignment — in production this would be a DB column
const INVESTMENT_TYPES: InvestmentType[] = ['Funding', 'Acquisition', 'Partnership', 'Franchise'];
function getDemoInvestmentType(id: string): InvestmentType {
  const idx = id.charCodeAt(0) % INVESTMENT_TYPES.length;
  return INVESTMENT_TYPES[idx];
}

const INVESTMENT_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  Funding:     { bg: '#EBF8FF', text: '#2B6CB0' },
  Acquisition: { bg: '#FFF5F5', text: '#C53030' },
  Partnership: { bg: '#F0FFF4', text: '#276749' },
  Franchise:   { bg: '#FFFBEB', text: '#B7791F' },
};

// ---------------------------------------------------------------------------
// Business card
// ---------------------------------------------------------------------------

interface BusinessCardProps {
  item: Business;
  investmentType: InvestmentType;
  onPress: () => void;
}

function BusinessCard({ item, investmentType, onPress }: BusinessCardProps) {
  const chipColor = INVESTMENT_CHIP_COLORS[investmentType] ?? INVESTMENT_CHIP_COLORS.Partnership;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Avatar placeholder */}
      <View style={styles.cardAvatarWrap}>
        <View style={styles.cardAvatar}>
          <Text style={styles.cardAvatarText}>{item.name[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.businessName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.row}>
            {item.category ? (
              <Text style={styles.category}>{item.category}</Text>
            ) : null}
            {item.city ? (
              <Text style={styles.city}>
                {item.category ? ' · ' : ''}{item.city}{item.state ? `, ${item.state}` : ''}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Investment type chip */}
      <View style={[styles.seekingBadge, { backgroundColor: chipColor.bg }]}>
        <Text style={[styles.seekingText, { color: chipColor.text }]}>
          Seeking {investmentType}
        </Text>
      </View>

      {/* Description */}
      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      ) : (
        <Text style={[styles.description, styles.descriptionPlaceholder]}>
          This business is open to investment conversations. Tap to learn more.
        </Text>
      )}

      {/* Arrow */}
      <View style={styles.cardFooter}>
        {item.verification_level && item.verification_level !== 'none' ? (
          <Text style={styles.verified}>Greenwood Verified™</Text>
        ) : (
          <View />
        )}
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function InvestorScreen() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<InvestmentType>('All');

  const fetchBusinesses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, category, city, state, description, verification_level, is_featured')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('name', { ascending: true })
        .limit(100);

      if (!error && data) {
        setBusinesses(data as Business[]);
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses().finally(() => setIsLoading(false));
  }, [fetchBusinesses]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBusinesses();
    setRefreshing(false);
  };

  const filtered = businesses.filter((b) => {
    if (activeFilter === 'All') return true;
    return getDemoInvestmentType(b.id) === activeFilter;
  });

  const renderItem = ({ item }: { item: Business }) => {
    const investmentType = getDemoInvestmentType(item.id);
    return (
      <BusinessCard
        item={item}
        investmentType={investmentType}
        onPress={() => router.push(`/investor/${item.id}`)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Investment Opportunities</Text>
          <Text style={styles.headerSub}>Connect with local businesses</Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="trending-up" size={24} color={Colors.gold} />
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filtersContainer}>
        <FlashList
          data={FILTER_TABS}
          horizontal
          estimatedItemSize={80}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item: tab }) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} {filtered.length === 1 ? 'opportunity' : 'opportunities'}
        </Text>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading opportunities...</Text>
        </View>
      ) : (
        <FlashList
          data={filtered}
          estimatedItemSize={160}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
              <Ionicons name="briefcase-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No opportunities found</Text>
              <Text style={styles.emptyText}>
                No businesses are currently listed under {activeFilter}. Check back soon or try a different filter.
              </Text>
            </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1 },
  headerText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  headerRight: {
    width: 36,
    alignItems: 'center',
  },

  // Filters
  filtersContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.textInverse,
  },

  // Count
  countRow: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  countText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.huge,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.md,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  cardAvatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
  },
  cardInfo: { flex: 1 },
  businessName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  category: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  city: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  seekingBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xxs + 1,
  },
  seekingText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  descriptionPlaceholder: {
    fontStyle: 'italic',
    color: Colors.textTertiary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verified: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },

  // States
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.massive,
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
