import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Linking, Share, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBusiness, useFollowBusiness } from '../../hooks/useBusinesses';
import { BusinessBadges } from '../../components/business/BusinessBadges';
import { THEME } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');
const DETAIL_TABS = ['About', 'Reviews', 'Events', 'Jobs', 'Offers'];

interface Review {
  id: string; rating: number; title: string | null; body: string | null;
  created_at: string; profiles: { full_name: string | null; tier: string } | null;
}
interface Event {
  id: string; title: string; start_at: string; is_free: boolean; type: string;
}
interface Job {
  id: string; title: string; type: string; is_remote: boolean; location: string | null;
}
interface Offer {
  id: string; title: string; offer_type: string; discount_percent: number | null;
  discount_amount: number | null; expires_at: string | null;
}

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: business, loading } = useBusiness(id as string);
  const { following, toggle: toggleFollow } = useFollowBusiness(id as string);
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('About');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    if (!id || !activeTab) return;
    setTabLoading(true);

    const loadTab = async () => {
      if (activeTab === 'Reviews') {
        const { data } = await supabase
          .from('reviews')
          .select('id, rating, title, body, created_at, profiles(full_name, tier)')
          .eq('business_id', id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(20);
        if (data) setReviews(data as Review[]);
      } else if (activeTab === 'Events') {
        const { data } = await supabase
          .from('events')
          .select('id, title, start_at, is_free, type')
          .eq('business_id', id)
          .eq('status', 'published')
          .gte('start_at', new Date().toISOString())
          .order('start_at', { ascending: true })
          .limit(10);
        if (data) setEvents(data as Event[]);
      } else if (activeTab === 'Jobs') {
        const { data } = await supabase
          .from('job_postings')
          .select('id, title, type, is_remote, location')
          .eq('business_id', id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) setJobs(data as Job[]);
      } else if (activeTab === 'Offers') {
        const { data } = await supabase
          .from('business_offers')
          .select('id, title, offer_type, discount_percent, discount_amount, expires_at')
          .eq('business_id', id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) setOffers(data as Offer[]);
      }
      setTabLoading(false);
    };

    loadTab();
  }, [activeTab, id]);

  if (loading || !business) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backBtnPlain} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={THEME.colors.text} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const yearsInBusiness = (business as any).year_founded
    ? new Date().getFullYear() - (business as any).year_founded
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
              {(business as any).family_name && (
                <Text style={styles.familyName}>The {(business as any).family_name} Family</Text>
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

          {verif && (
            <View style={[styles.verifBadge, { backgroundColor: verif.color + '20', borderColor: verif.color }]}>
              <Text style={[styles.verifText, { color: verif.color }]}>✔ {verif.label}</Text>
            </View>
          )}

          <BusinessBadges business={business} />

          {ageBadge && (
            <View style={[styles.ageBadge, { borderColor: ageBadge.color }]}>
              <Text style={styles.ageBadgeEmoji}>{ageBadge.emoji}</Text>
              <Text style={[styles.ageBadgeLabel, { color: ageBadge.color }]}>{ageBadge.label}</Text>
              {yearsInBusiness && <Text style={styles.ageBadgeYears}>{yearsInBusiness} years</Text>}
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, following && styles.actionBtnFollowing]}
              onPress={toggleFollow}
            >
              <Ionicons name={following ? 'heart' : 'heart-outline'} size={18} color={following ? '#EF4444' : THEME.colors.text} />
              <Text style={[styles.actionBtnText, following && styles.actionBtnTextFollowing]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push(`/review/write?business_id=${business.id}&business_name=${encodeURIComponent(business.name)}`)}
            >
              <Ionicons name="star-outline" size={18} color={THEME.colors.text} />
              <Text style={styles.actionBtnText}>Review</Text>
            </TouchableOpacity>

            {(business as any).phone && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${(business as any).phone}`)}>
                <Ionicons name="call-outline" size={18} color={THEME.colors.text} />
                <Text style={styles.actionBtnText}>Call</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`maps:?q=${encodeURIComponent((business as any).address ?? business.name)}`)}
            >
              <Ionicons name="navigate-outline" size={18} color={THEME.colors.text} />
              <Text style={styles.actionBtnText}>Directions</Text>
            </TouchableOpacity>

            {business.website && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(business.website!)}>
                <Ionicons name="globe-outline" size={18} color={THEME.colors.text} />
                <Text style={styles.actionBtnText}>Website</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
          {DETAIL_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.detailTab, activeTab === tab && styles.detailTabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.detailTabText, activeTab === tab && styles.detailTabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab content */}
        <View style={styles.tabBody}>
          {tabLoading && <ActivityIndicator color={THEME.colors.primary} style={{ marginVertical: 20 }} />}

          {!tabLoading && activeTab === 'About' && (
            <View style={styles.aboutSection}>
              {business.description ? <Text style={styles.description}>{business.description}</Text> : null}
              <View style={styles.infoList}>
                {(business as any).address && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={18} color={THEME.colors.textSecondary} />
                    <Text style={styles.infoText}>{(business as any).address}, {business.city}, {business.state}</Text>
                  </View>
                )}
                {(business as any).phone && (
                  <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${(business as any).phone}`)}>
                    <Ionicons name="call-outline" size={18} color={THEME.colors.textSecondary} />
                    <Text style={[styles.infoText, styles.infoLink]}>{(business as any).phone}</Text>
                  </TouchableOpacity>
                )}
                {business.website && (
                  <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(business.website!)}>
                    <Ionicons name="globe-outline" size={18} color={THEME.colors.textSecondary} />
                    <Text style={[styles.infoText, styles.infoLink]}>{business.website}</Text>
                  </TouchableOpacity>
                )}
                {(business as any).year_founded && (
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={18} color={THEME.colors.textSecondary} />
                    <Text style={styles.infoText}>Founded {(business as any).year_founded}{yearsInBusiness ? ` (${yearsInBusiness} years)` : ''}</Text>
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

          {!tabLoading && activeTab === 'Reviews' && (
            <View style={styles.reviewsSection}>
              <TouchableOpacity
                style={styles.leaveReviewBtn}
                onPress={() => router.push(`/review/write?business_id=${business.id}&business_name=${encodeURIComponent(business.name)}`)}
              >
                <Ionicons name="star-outline" size={18} color="#fff" />
                <Text style={styles.leaveReviewText}>Leave a Review</Text>
              </TouchableOpacity>
              {reviews.length === 0 ? (
                <Text style={styles.emptyTab}>No reviews yet — be the first!</Text>
              ) : reviews.map(r => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewName}>{r.profiles?.full_name ?? 'Anonymous'}</Text>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons key={i} name={i < r.rating ? 'star' : 'star-outline'} size={14} color={THEME.colors.gold} />
                      ))}
                    </View>
                    <Text style={styles.reviewDate}>{format(new Date(r.created_at), 'MMM d, yyyy')}</Text>
                  </View>
                  {r.title && <Text style={styles.reviewTitle}>{r.title}</Text>}
                  {r.body && <Text style={styles.reviewBody}>{r.body}</Text>}
                </View>
              ))}
            </View>
          )}

          {!tabLoading && activeTab === 'Events' && (
            <View style={styles.listSection}>
              {events.length === 0 ? (
                <Text style={styles.emptyTab}>No upcoming events</Text>
              ) : events.map(ev => (
                <TouchableOpacity key={ev.id} style={styles.listCard} onPress={() => router.push(`/events/${ev.id}`)}>
                  <View style={styles.listCardLeft}>
                    <Text style={styles.listCardDate}>{format(new Date(ev.start_at), 'MMM d')}</Text>
                    <Text style={styles.listCardTime}>{format(new Date(ev.start_at), 'h:mm a')}</Text>
                  </View>
                  <View style={styles.listCardBody}>
                    <Text style={styles.listCardTitle}>{ev.title}</Text>
                    <View style={styles.listCardMeta}>
                      {ev.is_free && <View style={styles.freeBadge}><Text style={styles.freeText}>FREE</Text></View>}
                      <Text style={styles.listCardType}>{ev.type.replace(/_/g, ' ')}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={THEME.colors.border} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!tabLoading && activeTab === 'Jobs' && (
            <View style={styles.listSection}>
              {jobs.length === 0 ? (
                <Text style={styles.emptyTab}>No open positions at this time</Text>
              ) : jobs.map(job => (
                <TouchableOpacity key={job.id} style={styles.listCard} onPress={() => router.push(`/jobs/${job.id}`)}>
                  <View style={styles.listCardBody}>
                    <Text style={styles.listCardTitle}>{job.title}</Text>
                    <Text style={styles.listCardType}>
                      {job.type.replace(/_/g, ' ')} · {job.is_remote ? 'Remote' : job.location ?? business.city}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={THEME.colors.border} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!tabLoading && activeTab === 'Offers' && (
            <View style={styles.listSection}>
              {offers.length === 0 ? (
                <Text style={styles.emptyTab}>No active offers</Text>
              ) : offers.map(offer => (
                <View key={offer.id} style={styles.offerCard}>
                  <View style={styles.offerLeft}>
                    <Text style={styles.offerDiscount}>
                      {offer.discount_percent ? `${offer.discount_percent}% OFF` : offer.discount_amount ? `$${offer.discount_amount} OFF` : offer.offer_type}
                    </Text>
                  </View>
                  <View style={styles.offerBody}>
                    <Text style={styles.offerTitle}>{offer.title}</Text>
                    {offer.expires_at && (
                      <Text style={styles.offerExpiry}>Expires {format(new Date(offer.expires_at), 'MMM d')}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtnPlain: { padding: 16 },
  coverContainer: { position: 'relative', height: 220 },
  coverImage: { width: '100%', height: 220 },
  coverPlaceholder: { backgroundColor: THEME.colors.primary, alignItems: 'center', justifyContent: 'center' },
  coverPlaceholderText: { fontSize: 64, color: '#fff', fontWeight: '700' },
  backBtn: {
    position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  shareBtn: {
    position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  businessHeader: { backgroundColor: '#fff', padding: 16, gap: 12 },
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
  verifBadge: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 5 },
  verifText: { fontSize: 13, fontWeight: '700' },
  ageBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  ageBadgeEmoji: { fontSize: 16 },
  ageBadgeLabel: { fontSize: 13, fontWeight: '700' },
  ageBadgeYears: { fontSize: 12, color: THEME.colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, borderWidth: 1.5, borderColor: THEME.colors.border, paddingHorizontal: 12, paddingVertical: 8 },
  actionBtnFollowing: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: THEME.colors.text },
  actionBtnTextFollowing: { color: '#EF4444' },
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
  hiringBadge: { backgroundColor: '#DCFCE7', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#16A34A' },
  hiringText: { color: '#16A34A', fontWeight: '600', fontSize: 14 },
  reviewsSection: { gap: 12 },
  leaveReviewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.colors.primary, borderRadius: 10, padding: 12, gap: 8 },
  leaveReviewText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyTab: { textAlign: 'center', color: THEME.colors.textSecondary, paddingVertical: 40 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 6, borderWidth: 1, borderColor: THEME.colors.border },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  reviewName: { fontSize: 13, fontWeight: '700', color: THEME.colors.text },
  reviewStars: { flexDirection: 'row', gap: 1 },
  reviewDate: { fontSize: 11, color: THEME.colors.textSecondary, marginLeft: 'auto' },
  reviewTitle: { fontSize: 14, fontWeight: '700', color: THEME.colors.text },
  reviewBody: { fontSize: 13, color: THEME.colors.text, lineHeight: 19 },
  listSection: { gap: 10 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: THEME.colors.border },
  listCardLeft: { width: 50, alignItems: 'center' },
  listCardDate: { fontSize: 13, fontWeight: '800', color: THEME.colors.primary },
  listCardTime: { fontSize: 10, color: THEME.colors.textSecondary },
  listCardBody: { flex: 1 },
  listCardTitle: { fontSize: 14, fontWeight: '700', color: THEME.colors.text },
  listCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  listCardType: { fontSize: 12, color: THEME.colors.textSecondary, textTransform: 'capitalize' },
  freeBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  freeText: { fontSize: 9, fontWeight: '700', color: '#166534' },
  offerCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: THEME.colors.border },
  offerLeft: { width: 70, backgroundColor: THEME.colors.primary, justifyContent: 'center', alignItems: 'center', padding: 10 },
  offerDiscount: { color: '#fff', fontWeight: '800', fontSize: 12, textAlign: 'center' },
  offerBody: { flex: 1, padding: 14 },
  offerTitle: { fontSize: 14, fontWeight: '700', color: THEME.colors.text },
  offerExpiry: { fontSize: 12, color: THEME.colors.textSecondary, marginTop: 3 },
});
