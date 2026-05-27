// =============================================================================
// Home / Discovery Feed
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
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
import { supabase } from '../../lib/supabase';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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

interface LeaderboardEntryDisplay {
  rank: number;
  userId: string;
  displayName: string;
  totalPoints: number;
  tier: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  start_at: string;
  address: string | null;
  businesses: { name: string } | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { locationLabel, requestPermission, hasPermission } = useLocation();
  const { data: businesses = [], loading: bizLoading, refetch } = useBusinesses({});
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDisplay[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | undefined>(undefined);
  const [impactStats, setImpactStats] = useState({
    localDollarsThisMonth: 0,
    businessesSupported: 0,
    localBusinessCount: 0,
    communityOwnedCount: 0,
    streakDays: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, []);

  const loadRealData = useCallback(async () => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
    const { data: { user } } = await supabase.auth.getUser();

    const [lbResult, impactResult, eventsResult] = await Promise.all([
      supabase
        .from('leaderboard_entries')
        .select('rank, score, user_id, profiles!user_id(full_name, tier)')
        .eq('period', 'monthly')
        .eq('category', 'spending')
        .order('rank', { ascending: true })
        .limit(10),
      user ? supabase
        .from('local_impact_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .gte('period_start', monthStart)
        .lte('period_end', monthEnd)
        .maybeSingle() : Promise.resolve({ data: null }),
      supabase
        .from('events')
        .select('id, title, start_at, address, businesses(name)')
        .gte('start_at', now.toISOString())
        .order('start_at', { ascending: true })
        .limit(3),
    ]);

    if (lbResult.data) {
      const entries = lbResult.data.map((e: any) => ({
        rank: e.rank,
        userId: e.user_id,
        displayName: e.profiles?.full_name ?? 'User',
        totalPoints: e.score ?? 0,
        tier: e.profiles?.tier ?? 'bronze',
      }));
      setLeaderboard(entries);
      if (user) {
        const myEntry = lbResult.data.find((e: any) => e.user_id === user.id);
        if (myEntry) setCurrentUserRank(myEntry.rank);
      }
    }

    if (impactResult.data) {
      const s = impactResult.data;
      setImpactStats({
        localDollarsThisMonth: Number(s.dollars_spent_local ?? 0),
        businessesSupported: s.businesses_supported ?? 0,
        localBusinessCount: s.businesses_supported ?? 0,
        communityOwnedCount: s.community_businesses_supported ?? 0,
        streakDays: 0,
      });
    }

    if (eventsResult.data) {
      setUpcomingEvents(eventsResult.data as UpcomingEvent[]);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadRealData();
  }, [loadRealData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), loadRealData()]);
    setRefreshing(false);
  };

  const tierInfo = profile ? TierColors[profile.tier] : TierColors['bronze'];
  const featuredBusinesses = businesses.filter((b) => b.is_featured).slice(0, 10);
  const localBusinesses = businesses.filter((b) => b.is_local_owned).slice(0, 10);

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
        {leaderboard.length > 0 && (
          <View style={styles.sectionPadded}>
            <LeaderboardCard
              entries={leaderboard}
              currentUserRank={currentUserRank}
              onViewAll={() => router.push('/leaderboard')}
            />
          </View>
        )}

        {/* Upcoming events */}
        <View style={styles.sectionPadded}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/events')}>
              <Text style={styles.seeAll}>Browse All</Text>
            </TouchableOpacity>
          </View>
          {upcomingEvents.length === 0 ? (
            <View style={styles.eventPlaceholder}>
              <Ionicons name="calendar-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.eventPlaceholderText}>
                No upcoming events yet. Check back soon!
              </Text>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {upcomingEvents.map(event => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventRow}
                  onPress={() => router.push(`/events/${event.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.eventDateBox}>
                    <Text style={styles.eventMonth}>
                      {new Date(event.start_at).toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                    <Text style={styles.eventDay}>
                      {new Date(event.start_at).getDate()}
                    </Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.eventBusiness} numberOfLines={1}>
                      {event.businesses?.name ?? ''}
                      {event.address ? ` · ${event.address}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  },
  eventsList: {
    gap: Spacing.sm,
  },
  eventRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventDateBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMonth: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  eventDay: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  eventBusiness: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});

