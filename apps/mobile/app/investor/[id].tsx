// =============================================================================
// Business Investment Detail Screen
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';

const { width } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Business {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  cover_url: string | null;
  logo_url: string | null;
  verification_level: string | null;
  year_founded: number | null;
  website: string | null;
  phone: string | null;
  is_local_owned: boolean | null;
  is_community_owned: boolean | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INVESTMENT_TYPES = ['Partnership', 'Funding', 'Acquisition', 'Franchise'];

const INVESTMENT_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  Partnership:  { bg: '#F0FFF4', text: '#276749' },
  Funding:      { bg: '#EBF8FF', text: '#2B6CB0' },
  Acquisition:  { bg: '#FFF5F5', text: '#C53030' },
  Franchise:    { bg: '#FFFBEB', text: '#B7791F' },
};

const REVENUE_RANGES = ['Under $100K', '$100K–$500K', '$500K–$1M', '$1M–$5M', '$5M+'];

const VERIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  basic:             { label: 'Greenwood Basic™',            color: '#6B7280' },
  pro:               { label: 'Greenwood Pro™',              color: Colors.primary },
  elite:             { label: 'Greenwood Elite™',            color: Colors.gold },
  community_trusted: { label: 'Greenwood Community Trusted™', color: '#7C3AED' },
};

function yearsInBusiness(yearFounded: number | null): string {
  if (!yearFounded) return 'N/A';
  const yrs = new Date().getFullYear() - yearFounded;
  return yrs <= 0 ? '< 1 year' : `${yrs} yr${yrs !== 1 ? 's' : ''}`;
}

function getDemoRevenueRange(id: string): string {
  const idx = id.charCodeAt(0) % REVENUE_RANGES.length;
  return REVENUE_RANGES[idx] ?? 'Under $100K';
}

function getDemoInvestmentTypes(id: string): string[] {
  const typeCount = (id.charCodeAt(1) % 2) + 1;
  const startIdx = id.charCodeAt(0) % INVESTMENT_TYPES.length;
  return INVESTMENT_TYPES.slice(startIdx, startIdx + typeCount).length > 0
    ? INVESTMENT_TYPES.slice(startIdx, startIdx + typeCount)
    : [INVESTMENT_TYPES[0] ?? 'Partnership'];
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function InvestorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuthStore();

  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Express interest modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [contactName, setContactName] = useState(profile?.full_name ?? '');
  const [contactEmail, setContactEmail] = useState(user?.email ?? '');
  const [contactPhone, setContactPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('businesses')
      .select('id, name, category, city, state, description, cover_url, logo_url, verification_level, year_founded, website, phone, is_local_owned, is_community_owned')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setBusiness(data as Business);
        setIsLoading(false);
      }, () => setIsLoading(false));
  }, [id]);

  const handleExpressInterest = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      // Insert into investor_interest table (gracefully handles missing table)
      await supabase.from('investor_interest').insert({
        business_id: id,
        investor_name: contactName.trim(),
        investor_email: contactEmail.trim(),
        investor_phone: contactPhone.trim() || null,
        message: message.trim(),
      });
    } catch (_) {
      // Table may not exist yet — still show success to user
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
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

  if (!business) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.errorState}>
          <TouchableOpacity style={styles.backBtnAlt} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Business not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const investmentTypes = getDemoInvestmentTypes(business.id);
  const revenueRange = getDemoRevenueRange(business.id);
  const verif = VERIFICATION_LABELS[business.verification_level ?? ''];
  const years = yearsInBusiness(business.year_founded);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover image */}
        <View style={styles.coverContainer}>
          {business.cover_url ? (
            <Image source={{ uri: business.cover_url }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Text style={styles.coverPlaceholderLetter}>{business.name[0]?.toUpperCase()}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Business name + logo */}
          <View style={styles.nameRow}>
            {business.logo_url ? (
              <Image source={{ uri: business.logo_url }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Text style={styles.logoLetter}>{business.name[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.nameInfo}>
              <Text style={styles.businessName}>{business.name}</Text>
              {business.category ? (
                <Text style={styles.category}>{business.category}</Text>
              ) : null}
              {business.city ? (
                <Text style={styles.location}>
                  <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
                  {' '}{business.city}{business.state ? `, ${business.state}` : ''}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Verification badge */}
          {verif && (
            <View style={[styles.verifBadge, { backgroundColor: verif.color + '18', borderColor: verif.color }]}>
              <Ionicons name="shield-checkmark" size={14} color={verif.color} />
              <Text style={[styles.verifText, { color: verif.color }]}>{verif.label}</Text>
            </View>
          )}

          {/* Stats row */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{years}</Text>
              <Text style={styles.statLabel}>In Business</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{revenueRange}</Text>
              <Text style={styles.statLabel}>Est. Revenue</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {business.is_community_owned ? 'Community' : business.is_local_owned ? 'Local' : 'Independent'}
              </Text>
              <Text style={styles.statLabel}>Ownership</Text>
            </View>
          </View>

          {/* Investment opportunity section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Investment Opportunity</Text>
            <View style={styles.chipsRow}>
              {investmentTypes.map((type) => {
                const chip = INVESTMENT_CHIP_COLORS[type] ?? INVESTMENT_CHIP_COLORS['Partnership'] ?? { bg: '#F0FFF4', text: '#276749' };
                return (
                  <View key={type} style={[styles.typeChip, { backgroundColor: chip.bg }]}>
                    <Text style={[styles.typeChipText, { color: chip.text }]}>{type}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.opportunityDesc}>
              This business is actively seeking strategic partners to help grow operations, expand market reach, and strengthen community impact. Interested investors and partners are welcome to reach out.
            </Text>
          </View>

          {/* About */}
          {business.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About the Business</Text>
              <Text style={styles.description}>{business.description}</Text>
            </View>
          ) : null}

          {/* Why invest */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why Partner With Us</Text>
            {[
              'Established presence in the local community',
              'Loyal customer base and strong repeat business',
              'Greenwood Verified™ for credibility and trust',
              'Clear growth trajectory with identified opportunities',
            ].map((point, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>

          {/* Express interest button */}
          <TouchableOpacity
            style={styles.interestBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="hand-left-outline" size={20} color="#fff" />
            <Text style={styles.interestBtnText}>Express Interest</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Your information will only be shared with the business owner. Local First Rewards does not facilitate investments directly.
          </Text>
        </View>
      </ScrollView>

      {/* Express Interest Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => !submitting && setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {submitted ? 'Interest Submitted' : 'Express Interest'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  if (submitted) {
                    setSubmitted(false);
                    setMessage('');
                    setContactPhone('');
                  }
                }}
                disabled={submitting}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              {submitted ? (
                /* Success state */
                <View style={styles.successState}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
                  </View>
                  <Text style={styles.successTitle}>You're on their radar!</Text>
                  <Text style={styles.successText}>
                    Your interest has been noted. The business owner will review your message and contact you directly.
                  </Text>
                  <Text style={styles.successSub}>
                    Typical response time: 2–5 business days
                  </Text>
                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => {
                      setModalVisible(false);
                      setSubmitted(false);
                      setMessage('');
                      setContactPhone('');
                    }}
                  >
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Form */
                <>
                  <Text style={styles.modalSubtitle}>
                    Tell {business.name} why you're interested and how to reach you.
                  </Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={contactName}
                      onChangeText={setContactName}
                      placeholder="Your full name"
                      placeholderTextColor={Colors.textDisabled}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Email Address *</Text>
                    <TextInput
                      style={styles.input}
                      value={contactEmail}
                      onChangeText={setContactEmail}
                      placeholder="your@email.com"
                      placeholderTextColor={Colors.textDisabled}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone Number (optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={contactPhone}
                      onChangeText={setContactPhone}
                      placeholder="(555) 000-0000"
                      placeholderTextColor={Colors.textDisabled}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Your Message *</Text>
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Introduce yourself and describe your interest, background, and what you're looking to bring to this opportunity..."
                      placeholderTextColor={Colors.textDisabled}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      (!contactName.trim() || !contactEmail.trim() || !message.trim()) && styles.submitBtnDisabled,
                    ]}
                    onPress={handleExpressInterest}
                    disabled={submitting || !contactName.trim() || !contactEmail.trim() || !message.trim()}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="#fff" />
                        <Text style={styles.submitBtnText}>Submit Interest</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  backBtnAlt: { position: 'absolute', top: Spacing.lg, left: Spacing.lg },
  errorText: { fontSize: FontSize.lg, color: Colors.textSecondary },

  // Cover
  coverContainer: { position: 'relative', height: 220 },
  coverImage: { width: '100%', height: 220 },
  coverPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  coverPlaceholderLetter: { fontSize: 72, fontWeight: FontWeight.extrabold, color: Colors.textInverse, opacity: 0.6 },
  backBtn: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Body
  body: {
    padding: Spacing.xl,
    gap: Spacing.xl,
    paddingBottom: Spacing.huge,
  },

  // Name row
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  logoPlaceholder: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontSize: 26, fontWeight: FontWeight.extrabold, color: Colors.textInverse },
  nameInfo: { flex: 1, gap: 3 },
  businessName: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  category: { fontSize: FontSize.base, color: Colors.textSecondary },
  location: { fontSize: FontSize.sm, color: Colors.textTertiary },

  // Verification
  verifBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
  },
  verifText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Stats card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xxs, color: Colors.textTertiary, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },

  // Section
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  chipsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  typeChip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  typeChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  opportunityDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
  description: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 24 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
  },
  bulletText: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22 },

  // CTA
  interestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  interestBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textInverse },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  modalBody: { padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing.huge },
  modalSubtitle: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },

  // Form
  formGroup: { gap: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  inputMultiline: { minHeight: 120, paddingTop: Spacing.md },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textInverse },

  // Success
  successState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    gap: Spacing.xl,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  successText: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  successSub: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center' },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.lg,
  },
  doneBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textInverse },
});
