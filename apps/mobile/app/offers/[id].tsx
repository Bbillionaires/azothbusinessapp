import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOffer, useRedeemOffer } from '../../hooks/useOffers';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';

const OFFER_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  discount:   { label: '% Off',       color: '#059669', bg: '#D1FAE5' },
  freebie:    { label: 'Free Item',   color: '#D97706', bg: '#FEF3C7' },
  coupon:     { label: 'Coupon',      color: '#2563EB', bg: '#DBEAFE' },
  gift_card:  { label: 'Gift Card',   color: '#7C3AED', bg: '#EDE9FE' },
  bogo:       { label: 'BOGO',        color: '#7C3AED', bg: '#EDE9FE' },
  event_special: { label: 'Event Deal', color: '#D97706', bg: '#FEF3C7' },
  loyalty:    { label: 'Loyalty',     color: '#0284C7', bg: '#E0F2FE' },
  first_visit:{ label: 'First Visit', color: '#DC2626', bg: '#FEE2E2' },
  flash:      { label: 'Flash Deal',  color: '#EA580C', bg: '#FFEDD5' },
};

function getTypeConfig(type: string) {
  return OFFER_TYPE_CONFIG[type] ?? { label: type, color: Colors.primary, bg: Colors.primaryBg };
}

function getDaysUntilExpiry(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatExpiryDate(expiresAt: string): string {
  return new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { offer, loading, error } = useOffer(id ?? '');
  const { redeem, redeeming } = useRedeemOffer();

  async function handleRedeem() {
    if (!offer) return;
    const result = await redeem(offer.id);
    if (result.success) {
      Alert.alert(
        'Offer Redeemed!',
        result.offer_title
          ? `You've successfully redeemed "${result.offer_title}".${result.points_bonus ? `\n\nYou earned +${result.points_bonus} bonus points!` : ''}`
          : 'Your offer has been redeemed successfully.',
        [{ text: 'Great!', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Redemption Failed', result.error ?? 'Something went wrong. Please try again.');
    }
  }

  function handleShare() {
    if (!offer) return;
    Share.share({
      title: offer.title,
      message: `Check out this offer: ${offer.title}${offer.businesses ? ` at ${(offer.businesses as any).name}` : ''}`,
    });
  }

  function handleCopyPromoCode() {
    if (!offer?.promo_code) return;
    // Use Alert as fallback since @react-native-clipboard/clipboard may not be installed
    Alert.alert('Promo Code', offer.promo_code, [
      { text: 'Copy', onPress: () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const Clipboard = require('@react-native-clipboard/clipboard').default;
          Clipboard.setString(offer.promo_code!);
        } catch {
          // Clipboard not available — code shown in alert above
        }
      }},
      { text: 'Close', style: 'cancel' },
    ]);
  }

  const isAlreadyClaimed =
    offer?.max_redemptions != null &&
    offer.current_redemptions >= offer.max_redemptions;

  const typeConfig = offer ? getTypeConfig(offer.offer_type) : null;

  const expiryDays = offer?.expires_at ? getDaysUntilExpiry(offer.expires_at) : null;
  const expiringSoon = expiryDays !== null && expiryDays <= 7;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Sticky header */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>Offer Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.navButton} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading offer…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : !offer ? (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Offer not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Business + title */}
          <View style={styles.heroSection}>
            {offer.businesses && (
              <Text style={styles.businessName}>{(offer.businesses as any).name}</Text>
            )}
            <Text style={styles.offerTitle}>{offer.title}</Text>
          </View>

          {/* Badges row */}
          <View style={styles.badgesRow}>
            {typeConfig && (
              <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
                <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                  {typeConfig.label}
                </Text>
              </View>
            )}
            {offer.points_bonus > 0 && (
              <View style={styles.pointsBadge}>
                <Ionicons name="star" size={12} color="#92400E" style={{ marginRight: 3 }} />
                <Text style={styles.pointsBadgeText}>Earn +{offer.points_bonus} pts</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {offer.description ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>About This Offer</Text>
              <Text style={styles.descriptionText}>{offer.description}</Text>
            </View>
          ) : null}

          {/* Expiry */}
          {offer.expires_at && (
            <View style={[styles.expiryBanner, expiringSoon && styles.expiryBannerUrgent]}>
              <Ionicons
                name="time-outline"
                size={16}
                color={expiringSoon ? Colors.error : Colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              {expiringSoon ? (
                <Text style={[styles.expiryText, styles.expiryTextUrgent]}>
                  Expires in {expiryDays} {expiryDays === 1 ? 'day' : 'days'}
                </Text>
              ) : (
                <Text style={styles.expiryText}>
                  Expires {formatExpiryDate(offer.expires_at)}
                </Text>
              )}
            </View>
          )}

          {/* Promo code */}
          {offer.promo_code && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Promo Code</Text>
              <TouchableOpacity
                onPress={handleCopyPromoCode}
                style={styles.promoCodeBox}
                activeOpacity={0.75}
              >
                <Text style={styles.promoCodeText}>{offer.promo_code}</Text>
                <View style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                  <Text style={styles.copyButtonText}>Copy</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Redemption count */}
          {offer.max_redemptions != null && (
            <View style={styles.redemptionInfo}>
              <Ionicons name="people-outline" size={14} color={Colors.textTertiary} style={{ marginRight: 4 }} />
              <Text style={styles.redemptionInfoText}>
                {Math.max(0, offer.max_redemptions - offer.current_redemptions)} of {offer.max_redemptions} uses remaining
              </Text>
            </View>
          )}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}

      {/* Sticky bottom CTA */}
      {!loading && !error && offer && (
        <View style={styles.footer}>
          {isAlreadyClaimed ? (
            <View style={[styles.redeemButton, styles.redeemButtonDisabled]}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.textDisabled} style={{ marginRight: 8 }} />
              <Text style={styles.redeemButtonTextDisabled}>Already Redeemed</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleRedeem}
              style={[styles.redeemButton, redeeming && styles.redeemButtonLoading]}
              activeOpacity={0.85}
              disabled={redeeming}
            >
              {redeeming ? (
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="gift-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.redeemButtonText}>
                {redeeming ? 'Redeeming…' : 'Redeem Offer'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.sm,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  navTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.error,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
  },
  backBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.massive,
  },

  // Hero
  heroSection: {
    marginBottom: Spacing.lg,
  },
  businessName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primaryLight,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  offerTitle: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    lineHeight: 36,
  },

  // Badges
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  typeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  typeBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pointsBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#92400E',
  },

  // Card sections
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Expiry
  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expiryBannerUrgent: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FCA5A5',
  },
  expiryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  expiryTextUrgent: {
    color: Colors.error,
    fontWeight: FontWeight.bold,
  },

  // Promo code
  promoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    borderStyle: 'dashed',
  },
  promoCodeText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.sm,
  },
  copyButtonText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },

  // Redemption info
  redemptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  redemptionInfoText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },

  // Footer CTA
  footer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    ...Shadows.md,
  },
  redeemButtonLoading: {
    opacity: 0.75,
  },
  redeemButtonDisabled: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  redeemButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
  redeemButtonTextDisabled: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textDisabled,
  },
});
