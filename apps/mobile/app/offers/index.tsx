import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl, ActivityIndicator, SafeAreaView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

type Offer = {
  id: string; title: string; description: string | null;
  offer_type: string; discount_percent: number | null; discount_amount: number | null;
  promo_code: string | null; expires_at: string | null; points_bonus: number;
  image_url: string | null; current_redemptions: number; max_redemptions: number | null;
  businesses: { id: string; name: string; city: string; state: string } | null;
};

const OFFER_TYPE_LABELS: Record<string, string> = {
  discount: '% Off', bogo: 'BOGO', freebie: 'Free Item',
  event_special: 'Event Deal', loyalty: 'Loyalty', first_visit: 'First Visit', flash: '⚡ Flash',
};

const OFFER_TYPE_COLORS: Record<string, string> = {
  discount: '#1B4332', bogo: '#7C3AED', freebie: '#059669',
  event_special: '#D97706', loyalty: '#0284C7', first_visit: '#DC2626', flash: '#EA580C',
};

function formatDiscount(offer: Offer): string {
  if (offer.discount_percent) return `${offer.discount_percent}% OFF`;
  if (offer.discount_amount) return `$${offer.discount_amount} OFF`;
  return 'Special Deal';
}

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 48 * 3600 * 1000;
}

export default function OffersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  async function fetchOffers() {
    let query = supabase
      .from('business_offers')
      .select('*, businesses(id, name, city, state)')
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (selectedType !== 'all') query = query.eq('offer_type', selectedType);

    const { data } = await query;
    if (data) setOffers(data as Offer[]);
    setLoading(false);
  }

  useEffect(() => { fetchOffers(); }, [selectedType]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  };

  const filterTypes = ['all', 'discount', 'bogo', 'freebie', 'flash', 'first_visit'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Local Deals</Text>
        <Text style={styles.subtitle}>Exclusive offers from local businesses</Text>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        {filterTypes.map(type => (
          <Pressable
            key={type}
            onPress={() => setSelectedType(type)}
            style={[styles.filterChip, selectedType === type && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, selectedType === type && styles.filterChipTextActive]}>
              {type === 'all' ? 'All Deals' : OFFER_TYPE_LABELS[type] ?? type}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#1B4332" /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B4332" />}
          contentContainerStyle={styles.list}
        >
          {offers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏷️</Text>
              <Text style={styles.emptyTitle}>No Deals Right Now</Text>
              <Text style={styles.emptyText}>Check back soon — local businesses post new deals daily!</Text>
            </View>
          ) : offers.map(offer => (
            <Pressable
              key={offer.id}
              onPress={() => router.push(`/business/${offer.businesses?.id}`)}
              style={styles.offerCard}
            >
              {offer.image_url ? (
                <Image source={{ uri: offer.image_url }} style={styles.offerImage} resizeMode="cover" />
              ) : (
                <View style={[styles.offerImagePlaceholder, { backgroundColor: (OFFER_TYPE_COLORS[offer.offer_type] ?? '#1B4332') + '20' }]}>
                  <Text style={[styles.discountText, { color: OFFER_TYPE_COLORS[offer.offer_type] ?? '#1B4332' }]}>
                    {formatDiscount(offer)}
                  </Text>
                </View>
              )}

              <View style={styles.offerContent}>
                <View style={styles.offerHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: OFFER_TYPE_COLORS[offer.offer_type] ?? '#1B4332' }]}>
                    <Text style={styles.typeBadgeText}>{OFFER_TYPE_LABELS[offer.offer_type] ?? offer.offer_type}</Text>
                  </View>
                  {offer.points_bonus > 0 && (
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsBadgeText}>+{offer.points_bonus} pts</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.offerTitle}>{offer.title}</Text>
                {offer.businesses && (
                  <Text style={styles.bizName}>{offer.businesses.name} • {offer.businesses.city}</Text>
                )}
                {offer.description && (
                  <Text style={styles.offerDesc} numberOfLines={2}>{offer.description}</Text>
                )}

                <View style={styles.offerFooter}>
                  {offer.promo_code && (
                    <View style={styles.promoCode}>
                      <Text style={styles.promoCodeText}>{offer.promo_code}</Text>
                    </View>
                  )}
                  {offer.expires_at && (
                    <Text style={[styles.expiryText, isExpiringSoon(offer.expires_at) && styles.expiryTextSoon]}>
                      {isExpiringSoon(offer.expires_at) ? '⚡ ' : ''}
                      Expires {new Date(offer.expires_at).toLocaleDateString()}
                    </Text>
                  )}
                  {offer.max_redemptions && (
                    <Text style={styles.redemptionText}>
                      {offer.max_redemptions - offer.current_redemptions} left
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  filterScroll: { maxHeight: 50 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#666' },
  filterChipTextActive: { color: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  list: { padding: 16, gap: 12 },
  emptyState: { paddingVertical: 60, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 32 },
  offerCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  offerImage: { width: '100%', height: 140 },
  offerImagePlaceholder: { width: '100%', height: 100, justifyContent: 'center', alignItems: 'center' },
  discountText: { fontSize: 28, fontWeight: '900' },
  offerContent: { padding: 14 },
  offerHeader: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  pointsBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  pointsBadgeText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  offerTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  bizName: { fontSize: 12, color: '#1B4332', fontWeight: '600', marginBottom: 4 },
  offerDesc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },
  offerFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  promoCode: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#F3F4F6', borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  promoCodeText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1 },
  expiryText: { fontSize: 11, color: '#888' },
  expiryTextSoon: { color: '#EA580C', fontWeight: '600' },
  redemptionText: { fontSize: 11, color: '#888' },
});
