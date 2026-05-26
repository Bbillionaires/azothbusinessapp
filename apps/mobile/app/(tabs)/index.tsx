// =============================================================================
// Home / Discovery Feed
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useBusinesses } from '../../hooks/useBusinesses';
import { useLocation } from '../../hooks/useLocation';
import { ImpactDashboard } from '../../components/home/ImpactDashboard';
import { LeaderboardCard } from '../../components/home/LeaderboardCard';
import { FeaturedBusinesses } from '../../components/home/FeaturedBusinesses';
import { PointsDisplay } from '../../components/ui/PointsDisplay';
import { Avatar } from '../../components/ui/Avatar';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';
import { TierColors } from '../../lib/theme';

// Mock leaderboard data — swap for real Supabase query
const MOCK_LEADERBOARD = [
  { rank: 1, userId: '1', displayName: 'Maria G.', totalPoints: 45200, tier: 'legend' },
  { rank: 2, userId: '2', displayName: 'James T.', totalPoints: 38100, tier: 'platinum' },
  { rank: 3, userId: '3', displayName: 'Aisha K.', totalPoints: 31500, tier: 'platinum' },
  { rank: 4, userId: '4', displayName: 'Devon M.', totalPoints: 24700, tier: 'gold' },
  { rank: 5, userId: '5', displayName: 'Sofia R.', totalPoints: 18300, tier: 'gold' },
];

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}

function QuickAction({ icon, label, color, bg, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickActionIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { locationLabel, requestPermission, hasPermission } = useLocation();
  const { businesses, isLoading: bizLoading, refetch } = useBusinesses({ searchQuery: '' });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch();
    setRefreshing(false);
  };

  const tierInfo = profile ? TierColors[profile.tier] : TierColors['bronze'];
  const featuredBusinesses = businesses.filter((b) => b.is_featured).slice(0, 10);
  const localBusinesses = businesses.filter((b) => b.is_local_owned).slice(0, 10);

  // Mock impact stats — swap with real aggregated query
  const impactStats = {
    localDollarsThisMonth: 847,
    businessesSupported: 12,
    localBusinessCount: 8,
    communityOwnedCount: 4,
    streakDays: 7,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {profile?.full_name
                ? `Hey, ${profile.full_name.split(' ')[0]}!`
                : 'Welcome back!'}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={Colors.textTertiary} />
              <Text style={styles.location}>{locationLabel}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.tierPill, { backgroundColor: tierInfo?.bg ?? Colors.primaryBg }]}>
              <Text style={styles.tierEmoji}>{tierInfo?.emoji ?? '🥉'}</Text>
              <PointsDisplay
                points={profile?.points_balance ?? 0}
                variant="pill"
                showIcon={false}
              />
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Avatar uri={profile?.avatar_url} name={profile?.full_name} size={40} borderColor={Colors.primary} borderWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickAction
            icon="scan-outline"
            label="Scan Receipt"
            color={Colors.primary}
            bg={Colors.primaryBg}
            onPress={() => router.push('/(tabs)/scan')}
          />
          <QuickAction
            icon="map-outline"
            label="Find Local"
            color={Colors.info}
            bg={Colors.infoBg}
            onPress={() => router.push('/(tabs)/map')}
          />
          <QuickAction
            icon="gift-outline"
            label="Rewards"
            color={Colors.goldDark}
            bg={Colors.goldBg}
            onPress={() => router.push('/(tabs)/rewards')}
          />
          <QuickAction
            icon="people-outline"
            label="Refer"
            color={Colors.success}
            bg={Colors.successBg}
            onPress={() => router.push('/referrals')}
          />
          <QuickAction
            icon="pricetag-outline"
            label="Deals"
            color="#EA580C"
            bg="#FFF7ED"
            onPress={() => router.push('/offers')}
          />
        </View>

        {/* Impact Dashboard */}
        <ImpactDashboard stats={impactStats} />

        {/* Featured Businesses */}
        <FeaturedBusinesses
          businesses={featuredBusinesses}
          title="Featured Businesses"
          isLoading={bizLoading}
        />

        {/* Local businesses */}
        {localBusinesses.length > 0 && (
          <FeaturedBusinesses
            businesses={localBusinesses}
            title="Local Owned"
            isLoading={bizLoading}
          />
        )}

        {/* Leaderboard */}
        <View style={styles.sectionPadded}>
          <LeaderboardCard
            entries={MOCK_LEADERBOARD}
            currentUserRank={23}
            onViewAll={() => router.push('/leaderboard')}
          />
        </View>

        {/* Upcoming events teaser */}
        <View style={styles.sectionPadded}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Browse All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.eventPlaceholder}>
            <Ionicons name="calendar-outline" size={32} color={Colors.textTertiary} />
            <Text style={styles.eventPlaceholderText}>
              Follow local businesses to see their upcoming events here.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    gap: Spacing.xxl,
    paddingBottom: Spacing.huge,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  headerLeft: { gap: 3 },
  greeting: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { fontSize: FontSize.sm, color: Colors.textTertiary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  tierEmoji: { fontSize: 14 },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  quickAction: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Sections
  sectionPadded: { paddingHorizontal: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  seeAll: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  eventPlaceholder: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  eventPlaceholderText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
