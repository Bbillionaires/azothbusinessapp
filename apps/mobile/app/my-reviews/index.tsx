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

interface MyReview {
  id: string;
  rating: number;
  body: string;
  status: string;
  created_at: string;
  helpful_count: number;
  business: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={i <= rating ? '#F59E0B' : Colors.border}
        />
      ))}
    </View>
  );
}

export default function MyReviewsScreen() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      const { data } = await supabase
        .from('reviews')
        .select('id, rating, body, status, created_at, helpful_count, business:businesses(id, name, city, state)')
        .eq('reviewer_id', user!.id)
        .order('created_at', { ascending: false });
      setReviews((data ?? []) as unknown as MyReview[]);
      setLoading(false);
    }
    load();
  }, [user]);

  const statusLabel = (status: string) => {
    if (status === 'published') return { label: 'Published', color: Colors.success };
    if (status === 'pending') return { label: 'Pending', color: Colors.warning ?? '#F59E0B' };
    return { label: 'Removed', color: Colors.error };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>My Reviews</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : reviews.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="star-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptyText}>Visit local businesses and share your experience.</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const { label, color } = statusLabel(item.status);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/business/${item.business.id}`)}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.businessName}>{item.business.name}</Text>
                    <Text style={styles.businessMeta}>
                      {item.business.city}, {item.business.state}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.statusText, { color }]}>{label}</Text>
                  </View>
                </View>
                <StarRating rating={item.rating} />
                {item.body ? (
                  <Text style={styles.reviewContent} numberOfLines={3}>{item.body}</Text>
                ) : null}
                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                  {item.helpful_count > 0 && (
                    <Text style={styles.helpfulText}>
                      👍 {item.helpful_count} found helpful
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
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
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  businessName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  businessMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { borderRadius: Radius.sm ?? 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  reviewContent: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: FontSize.xs ?? 11, color: Colors.textSecondary },
  helpfulText: { fontSize: FontSize.xs ?? 11, color: Colors.textSecondary },
});
