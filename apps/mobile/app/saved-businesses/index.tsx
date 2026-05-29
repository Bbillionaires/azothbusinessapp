import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Radius, FontSize } from '../../lib/theme';

interface SavedBusiness {
  id: string;
  business: {
    id: string;
    name: string;
    category: string;
    city: string;
    state: string;
    average_rating: number;
    total_reviews: number;
  };
  created_at: string;
}

export default function SavedBusinessesScreen() {
  const { user } = useAuthStore();
  const [saved, setSaved] = useState<SavedBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      const { data } = await supabase
        .from('business_followers')
        .select('id, created_at, business:businesses(id, name, category, city, state, average_rating, total_reviews)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      setSaved((data ?? []) as unknown as SavedBusiness[]);
      setLoading(false);
    }
    load();
  }, [user]);

  const handleUnfollow = async (followId: string) => {
    await supabase.from('business_followers').delete().eq('id', followId);
    setSaved(prev => prev.filter(s => s.id !== followId));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Businesses</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : saved.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>No saved businesses</Text>
          <Text style={styles.emptyText}>Follow businesses to see them here.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/map')}>
            <Text style={styles.browseBtnText}>Browse Businesses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/business/${item.business.id}`)}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="storefront-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.businessName}>{item.business.name}</Text>
                <Text style={styles.businessMeta}>
                  {item.business.category} · {item.business.city}, {item.business.state}
                </Text>
                {item.business.average_rating > 0 && (
                  <Text style={styles.rating}>
                    ⭐ {item.business.average_rating.toFixed(1)} ({item.business.total_reviews} reviews)
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => handleUnfollow(item.id)} style={styles.unfollowBtn}>
                <Ionicons name="bookmark" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  loader: { marginTop: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  browseBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 24, paddingVertical: 12, marginTop: Spacing.sm },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight ?? '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  businessName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  businessMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  rating: { fontSize: FontSize.xs ?? 11, color: Colors.textSecondary, marginTop: 2 },
  unfollowBtn: { padding: 8 },
});
