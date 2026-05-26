// =============================================================================
// Referral Marketplace Screen
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReferralLink {
  id: string;
  user_id: string;
  code: string;
  clicks: number;
  conversions: number;
  earnings: number;
}

interface ReferralEvent {
  id: string;
  referrer_id: string;
  status: string | null;
  cash_awarded: number | null;
  points_awarded: number;
}

interface ReferralProgram {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  type: string | null;
  rate: number;
  rate_type: string;
  is_active: boolean;
  businesses?: {
    name: string;
    category: string | null;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMMISSION_LABELS: Record<string, string> = {
  per_lead:       'Per Lead',
  per_sale:       'Per Sale',
  per_signup:     'Per Signup',
  revenue_share:  'Revenue Share',
  flat:           'Flat Rate',
};

const COMMISSION_COLORS: Record<string, { bg: string; text: string }> = {
  per_lead:       { bg: '#EBF8FF', text: '#2B6CB0' },
  per_sale:       { bg: '#F0FFF4', text: '#276749' },
  per_signup:     { bg: '#F3E8FF', text: '#6B21A8' },
  revenue_share:  { bg: '#FFFBEB', text: '#B7791F' },
  flat:           { bg: '#FFF5F5', text: '#C53030' },
};

function formatCommission(program: ReferralProgram): string {
  if (program.rate_type === 'percent') {
    return `${program.rate}% of sale`;
  }
  if (program.rate) {
    return `$${program.rate.toFixed(0)}`;
  }
  return 'Contact for details';
}

function getCommissionStyle(type: string | null) {
  return COMMISSION_COLORS[type ?? ''] ?? { bg: Colors.surfaceAlt, text: Colors.textSecondary };
}

// ---------------------------------------------------------------------------
// Program card
// ---------------------------------------------------------------------------

interface ProgramCardProps {
  program: ReferralProgram;
  onApply: () => void;
}

function ProgramCard({ program, onApply }: ProgramCardProps) {
  const commStyle = getCommissionStyle(program.type);
  const commissionLabel = COMMISSION_LABELS[program.type ?? ''] ?? 'Commission';
  const commissionValue = formatCommission(program);
  const businessName = program.businesses?.name ?? 'Unknown Business';
  const category = program.businesses?.category ?? '';

  return (
    <View style={styles.programCard}>
      {/* Business avatar + name */}
      <View style={styles.programHeader}>
        <View style={styles.programAvatar}>
          <Text style={styles.programAvatarText}>{businessName[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.programHeaderInfo}>
          <Text style={styles.programBizName} numberOfLines={1}>{businessName}</Text>
          {category ? <Text style={styles.programCategory}>{category}</Text> : null}
        </View>
        <View style={[styles.commissionTypeBadge, { backgroundColor: commStyle.bg }]}>
          <Text style={[styles.commissionTypeText, { color: commStyle.text }]}>{commissionLabel}</Text>
        </View>
      </View>

      {/* Title */}
      {program.title ? (
        <Text style={styles.programTitle}>{program.title}</Text>
      ) : null}

      {/* Description */}
      {program.description ? (
        <Text style={styles.programDesc} numberOfLines={2}>{program.description}</Text>
      ) : null}

      {/* Commission amount */}
      <View style={styles.programCommissionRow}>
        <View style={styles.programCommissionBox}>
          <Text style={styles.programCommissionLabel}>You earn</Text>
          <Text style={styles.programCommissionValue}>{commissionValue}</Text>
          <Text style={styles.programCommissionSub}>{commissionLabel}</Text>
        </View>
        <TouchableOpacity style={styles.applyBtn} onPress={onApply} activeOpacity={0.85}>
          <Text style={styles.applyBtnText}>Apply to Program</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ReferralsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [referralLink, setReferralLink] = useState<ReferralLink | null>(null);
  const [events, setEvents] = useState<ReferralEvent[]>([]);
  const [programs, setPrograms] = useState<ReferralProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [linkRes, eventsRes, programsRes] = await Promise.all([
        supabase
          .from('referral_links')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('referral_events')
          .select('id, referrer_id, status, cash_awarded, points_awarded')
          .eq('referrer_id', user.id),
        supabase
          .from('referral_marketplace')
          .select('*, businesses(name, category)')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);

      if (!linkRes.error && linkRes.data) setReferralLink(linkRes.data as ReferralLink);
      if (!eventsRes.error && eventsRes.data) setEvents(eventsRes.data as ReferralEvent[]);
      if (!programsRes.error && programsRes.data) setPrograms(programsRes.data as ReferralProgram[]);
    } catch (err) {
      console.error('Failed to fetch referral data:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData().finally(() => setIsLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleShare = async () => {
    const code = referralLink?.code ?? user?.id?.slice(0, 8).toUpperCase() ?? 'LOCALFIRST';
    const url = `https://localfirstrewards.com/join?ref=${code}`;
    try {
      await Share.share({
        message: `Join me on Local First Rewards and support local businesses! Use my referral code ${code} or sign up here: ${url}`,
        url,
        title: 'Join Local First Rewards',
      });
    } catch (err) {
      Alert.alert('Share failed', 'Unable to share at this time. Please try again.');
    }
  };

  // Stats derived from events
  const totalReferrals = events.length;
  const successful = events.filter((e) => e.status === 'converted' || e.status === 'completed').length;
  const totalEarned = referralLink?.earnings
    ?? events.reduce((sum, e) => sum + (e.cash_awarded ?? 0), 0);

  const referralCode = referralLink?.code ?? user?.id?.slice(0, 8).toUpperCase() ?? '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Referral Marketplace</Text>
          <Text style={styles.headerSub}>Earn by sharing local businesses</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Referral link card */}
        <View style={styles.linkCard}>
          <View style={styles.linkCardHeader}>
            <Ionicons name="link" size={20} color={Colors.primary} />
            <Text style={styles.linkCardTitle}>Your Referral Link</Text>
          </View>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Your Code</Text>
            <Text style={styles.codeValue}>{referralCode}</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-social-outline" size={20} color={Colors.textInverse} />
            <Text style={styles.shareBtnText}>Share Your Link</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{successful}</Text>
            <Text style={styles.statLabel}>Conversions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statValueGold]}>
              ${totalEarned.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>

        {/* Programs section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Referral Programs</Text>
          <Text style={styles.sectionSub}>Join a program and start earning</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : programs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No programs yet</Text>
            <Text style={styles.emptyText}>
              Check back soon — local businesses are signing up to offer referral programs.
            </Text>
          </View>
        ) : (
          programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onApply={() => router.push(`/referrals/${program.id}`)}
            />
          ))
        )}

        {/* How it works */}
        <View style={styles.howItWorksCard}>
          <Text style={styles.howTitle}>How Referrals Work</Text>
          {[
            { icon: 'share-social-outline' as const, text: 'Share your personal referral link or a business program link' },
            { icon: 'person-add-outline' as const, text: 'Your friend signs up or makes a purchase through your link' },
            { icon: 'cash-outline' as const, text: 'You earn points or cash commission — deposited automatically' },
          ].map(({ icon, text }, i) => (
            <View key={i} style={styles.howRow}>
              <View style={styles.howIconWrap}>
                <Ionicons name={icon} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.howText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  headerText: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textInverse },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Scroll
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.huge,
    gap: Spacing.xl,
  },

  // Link card
  linkCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryPale,
    ...Shadows.md,
  },
  linkCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  linkCardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  codeBox: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 3,
  },
  codeLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.semibold },
  codeValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary, letterSpacing: 2 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  shareBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.textInverse },

  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.sm,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statValueGold: { color: Colors.goldDark },
  statLabel: { fontSize: FontSize.xxs, color: Colors.textTertiary, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },

  // Section header
  sectionHeader: { gap: 3 },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  sectionSub: { fontSize: FontSize.sm, color: Colors.textTertiary },

  // Program card
  programCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.md,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  programAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programAvatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textInverse },
  programHeaderInfo: { flex: 1 },
  programBizName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  programCategory: { fontSize: FontSize.xs, color: Colors.textTertiary },
  commissionTypeBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  commissionTypeText: { fontSize: FontSize.xxs, fontWeight: FontWeight.bold },
  programTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  programDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  programCommissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  programCommissionBox: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  programCommissionLabel: { fontSize: FontSize.xxs, color: Colors.textTertiary },
  programCommissionValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  programCommissionSub: { fontSize: FontSize.xxs, color: Colors.textTertiary },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  applyBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Colors.textInverse },

  // States
  loadingState: { paddingVertical: Spacing.huge, alignItems: 'center' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.massive,
    gap: Spacing.md,
  },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.base, color: Colors.textTertiary, textAlign: 'center', lineHeight: 22 },

  // How it works
  howItWorksCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadows.sm,
  },
  howTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  howRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  howIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22, paddingTop: 7 },
});
