import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Share,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBusinesses } from '../../hooks/useBusinesses';
import { BusinessBadges } from '../../components/business/BusinessBadges';
import { THEME } from '../../lib/theme';

const { width } = Dimensions.get('window');

const DETAIL_TABS = ['About', 'Reviews', 'Events', 'Jobs', 'Offers'];

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBusinessById } = useBusinesses({});
  const business = getBusinessById(id);
  const [activeTab, setActiveTab] = useState('About');
  const [isFollowing, setIsFollowing] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!business) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading business...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const yearsInBusiness = business.year_founded
    ? new Date().getFullYear() - business.year_founded
    : null;

  const getAgeBadge = () => {
    if (!yearsInBusiness) return null;
    if (yearsInBusiness >= 50) return { emoji: '⭐', label: 'Community Landmark', color: '#8B5CF6' };
    if (yearsInBusiness >= 25) return { emoji: '👑', label: 'Historic Business', color: '#D97706' };
    if (yearsInBusiness >= 10) return { emoji: '🏆', label: 'Legacy Business', color: THEME.colors.gold };
    if (yearsInBusiness >= 3) return { emoji: '🏛', label: 'Established', color: THEME.colors.primary };
    return { emoji: '🌱', label: 'New Business', color: '#10B981' };
  };

  const ageBadge = getAgeBadge();

  const verificationLabel: Record<string, { label: string; color: string }> = {
    basic: { label: 'Greenwood Basic™', color: '#6B7280' },
    pro: { label: 'Greenwood Pro™', color: THEME.colors.primary },
    elite: { label: 'Greenwood Elite™', color: THEME.colors.gold },
    community_trusted: { label: 'Greenwood Community Trusted™', color: '#7C3AED' },
  };

  const verif = verificationLabel[business.verification_level ?? ''];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover photo */}
        <View style={styles.coverContainer}>
          {business.cover_url ? (
            <Image source={{ uri: business.cover_url }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Text style={styles.coverPlaceholderText}>{business.name[0]}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => Share.share({ message: `Check out ${business.name} on Local First Rewards!` })}
          >
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Business header */}
        <View style={styles.businessHeader}>
          <View style={styles.logoRow}>
            {business.logo_url ? (
              <Image source={{ uri: business.logo_url }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Text style={styles.logoText}>{business.name[0]}</Text>
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.businessName}>{business.name}</Text>
              {business.family_name && (
                <Text style={styles.familyName}>The {business.family_name} Family</Text>
              )}
              <Text style={styles.category}>{business.category}</Text>
              {business.average_rating ? (
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingStars}>⭐ {business.average_rating.toFixed(1)}</Text>
                  <Text style={styles.ratingCount}>({business.total_reviews} reviews)</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Verification badge */}
          {verif && (
            <View style={[styles.verifBadge, { backgroundColor: verif.color + '20', borderColor: verif.color }]}>
              <Text style={[styles.verifText, { color: verif.color }]}>✔ {verif.label}</Text>
            </View>
          )}

          {/* Business badges */}
          <BusinessBadges business={business} />

          {/* Age badge */}
          {ageBadge && (
            <View style={[styles.ageBadge, { borderColor: ageBadge.color }]}>
              <Text style={styles.ageBadgeEmoji}>{ageBadge.emoji}</Text>
              <Text style={[styles.ageBadgeLabel, { color: ageBadge.color }]}>{ageBadge.label}</Text>
              {yearsInBusiness && (
                <Text style={styles.ageBadgeYears}>{yearsInBusiness} years</Text>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, isFollowing && styles.actionBtnActive]}
              onPress={() => setIsFollowing(!isFollowing)}
            >
              <Ionicons
                name={isFollowing ? 'heart' : 'heart-outline'}
                size={18}
                color={isFollowing ? '#EF4444' : THEME.colors.text}
              />
              <Text style={[styles.actionBtnText, isFollowing && styles.actionBtnTextActive]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push(`/review/write?business_id=${business.id}&business_name=${encodeURIComponent(business.name)}`)}
            >
              <Ionicons name="star-outline" size={18} color={THEME.colors.text} />
              <Text style={styles.actionBtnText}>Review</Text>
            </TouchableOpacity>

            {business.phone && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(`tel:${business.phone}`)}
              >
                <Ionicons name="call-outline" size={18} color={THEME.colors.text} />
                <Text style={styles.actionBtnText}>Call</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`maps:?q=${encodeURIComponent(business.address ?? '')}`)}
            >
              <Ionicons name="navigate-outline" size={18} color={THEME.colors.text} />
              <Text style={styles.actionBtnText}>Directions</Text>
            </TouchableOpacity>

            {business.website && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(business.website!)}
              >
                <Ionicons name="globe-outline" size={18} color={THEME.colors.text} />
                <Text style={styles.actionBtnText}>Website</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Referral program highlight */}
          {(business.referral_percentage || business.referral_fixed_amount) && (
            <View style={styles.referralBanner}>
              <Text style={styles.referralBannerIcon}>💰</Text>
              <View>
                <Text style={styles.referralBannerTitle}>Referral Program Available</Text>
                <Text style={styles.referralBannerDesc}>
                  {business.referral_percentage
                    ? `Earn ${business.referral_percentage}% on referrals`
                    : `Earn $${business.referral_fixed_amount} per referral`}
                </Text>
              </View>
              <TouchableOpacity style={styles.referralJoinBtn}>
                <Text style={styles.referralJoinText}>Join</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tab bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContent}
        >
          {DETAIL_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.detailTab, activeTab === tab && styles.detailTabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.detailTabText, activeTab === tab && styles.detailTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab content */}
        <View style={styles.tabBody}>
          {activeTab === 'About' && (
            <View style={styles.aboutSection}>
              {business.description ? (
                <Text style={styles.description}>{business.description}</Text>
              ) : null}

              <View style={styles.infoList}>
                {business.address && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={18} color={THEME.colors.textSecondary} />
                    <Text style={styles.infoText}>{business.address}, {business.city}, {business.state}</Text>
                  </View>
                )}
                {business.phone && (
                  <TouchableOpacity
                    style={styles.infoRow}
                    onPress={() => Linking.openURL(`tel:${business.phone}`)}
                  >
                    <Ionicons name="call-outline" size={18} color={THEME.colors.textSecondary} />
                    <Text style={[styles.infoText, styles.infoLink]}>{business.phone}</Text>
                  </TouchableOpacity>
                )}
                {business.website && (
                  <TouchableOpacity
                    style={styles.infoRow}
                    onPress={() => Linking.openURL(business.website!)}
                  >
                    <Ionicons name="globe-outline" size={18} color={THEME.colors.textSecondary} />
                    <Text style={[styles.infoText, styles.infoLink]}>{business.website}</Text>
                  </TouchableOpacity>
                )}
                {business.year_founded && (
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={18} color={THEME.colors.textSecondary} />
                    <Text style={styles.infoText}>Founded {business.year_founded} ({yearsInBusiness} years in business)</Text>
                  </View>
                )}
                {business.hiring_now && (
                  <View style={[styles.infoRow, styles.hiringBadge]}>
                    <Text style={styles.hiringText}>🟢 Actively Hiring — View Open Positions</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {activeTab === 'Reviews' && (
            <View style={styles.reviewsSection}>
              <TouchableOpacity
                style={styles.leaveReviewBtn}
                onPress={() => router.push(`/review/write?business_id=${business.id}&business_name=${encodeURIComponent(business.name)}`)}
              >
                <Ionicons name="star-outline" size={18} color="#fff" />
                <Text style={styles.leaveReviewText}>Leave a Review</Text>
              </TouchableOpacity>
              <Text style={styles.comingSoon}>Reviews loading...</Text>
            </View>
          )}

          {activeTab === 'Events' && (
            <View style={styles.eventsSection}>
              <Text style={styles.comingSoon}>No upcoming events</Text>
            </View>
          )}

          {activeTab === 'Jobs' && (
            <View style={styles.jobsSection}>
              {business.hiring_now ? (
                <TouchableOpacity
                  style={styles.viewJobsBtn}
                  onPress={() => router.push(`/jobs/${id}`)}
                >
                  <Ionicons name="briefcase-outline" size={18} color={THEME.colors.primary} />
                  <Text style={styles.viewJobsText}>View Open Positions</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.comingSoon}>No open positions at this time</Text>
              )}
            </View>
          )}

          {activeTab === 'Offers' && (
            <View style={styles.offersSection}>
              <Text style={styles.comingSoon}>No active offers</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: THEME.colors.textSecondary },
  coverContainer: { position: 'relative', height: 220 },
  coverImage: { width: '100%', height: 220 },
  coverPlaceholder: { backgroundColor: THEME.colors.primary, alignItems: 'center', justifyContent: 'center' },
  coverPlaceholderText: { fontSize: 64, color: '#fff', fontWeight: '700' },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  shareBtn: {
    position: 'absolute', top: 16, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  businessHeader: {
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
  },
  logoRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  logo: { width: 72, height: 72, borderRadius: 14, borderWidth: 2, borderColor: THEME.colors.border },
  logoPlaceholder: { backgroundColor: THEME.colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  headerInfo: { flex: 1, gap: 3 },
  businessName: { fontSize: 20, fontWeight: '800', color: THEME.colors.text },
  familyName: { fontSize: 13, color: THEME.colors.textSecondary, fontStyle: 'italic' },
  category: { fontSize: 14, color: THEME.colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingStars: { fontSize: 14, fontWeight: '600', color: THEME.colors.text },
  ratingCount: { fontSize: 13, color: THEME.colors.textSecondary },
  verifBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  verifText: { fontSize: 13, fontWeight: '700' },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  ageBadgeEmoji: { fontSize: 16 },
  ageBadgeLabel: { fontSize: 13, fontWeight: '700' },
  ageBadgeYears: { fontSize: 12, color: THEME.colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionBtnActive: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: THEME.colors.text },
  actionBtnTextActive: { color: '#EF4444' },
  referralBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryLight,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  referralBannerIcon: { fontSize: 24 },
  referralBannerTitle: { fontSize: 14, fontWeight: '700', color: THEME.colors.primary },
  referralBannerDesc: { fontSize: 12, color: THEME.colors.textSecondary },
  referralJoinBtn: {
    marginLeft: 'auto',
    backgroundColor: THEME.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  referralJoinText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tabScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: THEME.colors.border },
  tabContent: { paddingHorizontal: 16, gap: 4 },
  detailTab: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  detailTabActive: { borderBottomColor: THEME.colors.primary },
  detailTabText: { fontSize: 14, fontWeight: '600', color: THEME.colors.textSecondary },
  detailTabTextActive: { color: THEME.colors.primary },
  tabBody: { padding: 16, minHeight: 300 },
  aboutSection: { gap: 16 },
  description: { fontSize: 15, color: THEME.colors.text, lineHeight: 22 },
  infoList: { gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 14, color: THEME.colors.text, flex: 1 },
  infoLink: { color: THEME.colors.primary, textDecorationLine: 'underline' },
  hiringBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  hiringText: { color: '#16A34A', fontWeight: '600', fontSize: 14 },
  reviewsSection: { gap: 16 },
  leaveReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  leaveReviewText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  comingSoon: { textAlign: 'center', color: THEME.colors.textSecondary, paddingVertical: 40 },
  eventsSection: {},
  jobsSection: {},
  offersSection: {},
  viewJobsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  viewJobsText: { color: THEME.colors.primary, fontWeight: '700', fontSize: 15 },
});
