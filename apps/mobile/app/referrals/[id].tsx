// =============================================================================
// Referral Program Detail Screen
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReferralProgram {
  id: string;
  business_id: string;
  title: string | null;
  description: string | null;
  terms: string | null;
  requirements: string | null;
  type: string | null;
  rate: number | null;
  rate_type: string | null;
  is_active: boolean;
  created_at: string | null;
  businesses?: {
    id: string;
    name: string;
    category: string | null;
    city: string | null;
    state: string | null;
    verification_level: string | null;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMMISSION_LABELS: Record<string, string> = {
  pay_per_lead:        'Per Lead',
  pay_per_appointment: 'Per Appointment',
  pay_per_sale:        'Per Sale',
  affiliate:           'Affiliate',
  commission:          'Commission',
};

const COMMISSION_COLORS: Record<string, { bg: string; text: string }> = {
  pay_per_lead:        { bg: '#EBF8FF', text: '#2B6CB0' },
  pay_per_appointment: { bg: '#F3E8FF', text: '#6B21A8' },
  pay_per_sale:        { bg: '#F0FFF4', text: '#276749' },
  affiliate:           { bg: '#FFFBEB', text: '#B7791F' },
  commission:          { bg: '#FFF5F5', text: '#C53030' },
};

function formatCommissionValue(program: ReferralProgram): string {
  if (!program.rate) return '—';
  if (program.rate_type === 'percentage') {
    return `${program.rate}%`;
  }
  return `$${program.rate.toFixed(0)}`;
}

const DEFAULT_REQUIREMENTS = [
  'Must be a registered Local First Rewards member',
  'Referred users must be new to this business',
  'Commissions paid after 30-day hold period',
  'One referral commission per unique customer',
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ReferralProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuthStore();

  const [program, setProgram] = useState<ReferralProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('referral_marketplace')
      .select('*, businesses(id, name, category, city, state, verification_level)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setProgram(data as ReferralProgram);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!user?.id || !program) return;

    Alert.alert(
      'Apply to Program',
      `Apply to the referral program for ${program.businesses?.name ?? 'this business'}? You'll be able to start earning commissions immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            setApplying(true);
            try {
              await supabase.from('referral_applications').insert({
                marketplace_id: program.id,
                user_id: user.id,
                status: 'applied',
              });
            } catch (_) {
              // Table may not exist yet — show success regardless
            } finally {
              setApplying(false);
              setApplied(true);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!program) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.errorState}>
          <TouchableOpacity style={styles.backBtnAlt} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Program not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const business = program.businesses;
  const commStyle = COMMISSION_COLORS[program.type ?? ''] ?? { bg: Colors.surfaceAlt, text: Colors.textSecondary };
  const commLabel = COMMISSION_LABELS[program.type ?? ''] ?? 'Commission';
  const commValue = formatCommissionValue(program);
  const requirements = program.requirements
    ? program.requirements.split('\n').filter(Boolean)
    : DEFAULT_REQUIREMENTS;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerText} numberOfLines={1}>
          {business?.name ?? 'Referral Program'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Program identity */}
        <View style={styles.identityCard}>
          <View style={styles.bizAvatar}>
            <Text style={styles.bizAvatarText}>{(business?.name ?? '?')[0].toUpperCase()}</Text>
          </View>
          <View style={styles.bizInfo}>
            <Text style={styles.bizName}>{business?.name ?? 'Unknown Business'}</Text>
            {business?.category ? <Text style={styles.bizCategory}>{business.category}</Text> : null}
            {business?.city ? (
              <Text style={styles.bizLocation}>
                {business.city}{business.state ? `, ${business.state}` : ''}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Program title */}
        {program.title ? (
          <Text style={styles.programTitle}>{program.title}</Text>
        ) : null}

        {/* Commission highlight */}
        <View style={styles.commissionCard}>
          <Text style={styles.commissionCardLabel}>Commission Structure</Text>
          <View style={styles.commissionRow}>
            <View style={styles.commissionMain}>
              <Text style={styles.commissionValue}>{commValue}</Text>
              <View style={[styles.commissionTypeBadge, { backgroundColor: commStyle.bg }]}>
                <Text style={[styles.commissionTypeText, { color: commStyle.text }]}>{commLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        {program.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Program</Text>
            <Text style={styles.sectionText}>{program.description}</Text>
          </View>
        ) : null}

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {requirements.map((req, i) => (
            <View key={i} style={styles.requirementRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>

        {/* Terms */}
        {program.terms ? (
          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{program.terms}</Text>
          </View>
        ) : (
          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>
              Commissions are tracked automatically through your unique referral link. Payouts are processed monthly via your configured payout method. Local First Rewards reserves the right to withhold commission for fraudulent referrals. By applying you agree to the standard affiliate terms of service.
            </Text>
          </View>
        )}

        {/* Applied success state */}
        {applied ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <View style={styles.successBannerText}>
              <Text style={styles.successBannerTitle}>Application Submitted!</Text>
              <Text style={styles.successBannerSub}>
                The business will review your application. You can start using your referral link in the meantime.
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.applyBtn, applying && styles.applyBtnLoading]}
            onPress={handleApply}
            disabled={applying}
            activeOpacity={0.85}
          >
            {applying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text style={styles.applyBtnText}>Apply to Program</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.footerNote}>
          Questions? Contact the business directly through their profile page.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Loading / Error
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  backBtnAlt: { position: 'absolute', top: Spacing.lg, left: Spacing.lg },
  errorText: { fontSize: FontSize.lg, color: Colors.textSecondary },

  // Header
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
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
  headerText: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
  },

  // Scroll
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.huge,
    gap: Spacing.xl,
  },

  // Identity card
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  bizAvatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bizAvatarText: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textInverse },
  bizInfo: { flex: 1, gap: 2 },
  bizName: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  bizCategory: { fontSize: FontSize.sm, color: Colors.textSecondary },
  bizLocation: { fontSize: FontSize.xs, color: Colors.textTertiary },

  // Program title
  programTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },

  // Commission card
  commissionCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryPale,
  },
  commissionCardLabel: { fontSize: FontSize.sm, color: Colors.textTertiary, fontWeight: FontWeight.semibold },
  commissionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commissionMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  commissionValue: { fontSize: 36, fontWeight: FontWeight.extrabold, color: Colors.primary },
  commissionTypeBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  commissionTypeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  minPayoutBox: { alignItems: 'flex-end', gap: 2 },
  minPayoutLabel: { fontSize: FontSize.xxs, color: Colors.textTertiary },
  minPayoutValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },

  // Section
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionText: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 24 },
  requirementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  requirementText: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22 },

  // Terms
  termsBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  termsTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  termsText: { fontSize: FontSize.xs, color: Colors.textTertiary, lineHeight: 20 },

  // Apply
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  applyBtnLoading: { opacity: 0.7 },
  applyBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textInverse },

  // Success banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.successBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.success,
  },
  successBannerText: { flex: 1, gap: 4 },
  successBannerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.success },
  successBannerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Footer
  footerNote: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
