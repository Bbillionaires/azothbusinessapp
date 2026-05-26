import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl, ActivityIndicator, SafeAreaView, Image,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

type LeaderboardType = 'spending' | 'referrals' | 'reviews' | 'impact';

type Entry = {
  rank: number;
  user_id: string;
  score: number;
  leaderboard_type: LeaderboardType;
  profiles: { display_name: string | null; avatar_url: string | null; legend_tier: string | null } | null;
};

const TABS: { key: LeaderboardType; label: string }[] = [
  { key: 'spending', label: 'Spending' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'impact', label: 'Impact' },
];

const MEDAL = ['🥇', '🥈', '🥉'];

const TIER_COLORS: Record<string, string> = {
  hall_of_legends: '#7C3AED',
  legend: '#7C3AED',
  platinum: '#64748B',
  gold: '#D4AF37',
  silver: '#94A3B8',
  bronze: '#92400E',
};

function maskName(name: string | null): string {
  if (!name) return 'Anonymous';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('spending');
  const [data, setData] = useState<Entry[]>([]);
  const [myRank, setMyRank] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: entries } = await supabase
      .from('leaderboard_entries')
      .select('rank, user_id, score, leaderboard_type, profiles(display_name, avatar_url, legend_tier)')
      .eq('period_type', 'monthly')
      .eq('leaderboard_type', activeTab)
      .order('rank', { ascending: true })
      .limit(50);

    if (entries) {
      setData(entries as Entry[]);
      const mine = entries.find(e => e.user_id === user?.id) as Entry | undefined;
      setMyRank(mine ?? null);
    }
    setLoading(false);
  }, [activeTab, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Monthly Rankings</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1B4332" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B4332" />}
        >
          {/* Top 3 podium */}
          {data.length >= 3 && (
            <View style={styles.podium}>
              {[data[1], data[0], data[2]].map((entry, podiumIndex) => {
                if (!entry) return null;
                const rankOrder = [2, 1, 3][podiumIndex];
                const heights = [80, 100, 70];
                const initials = maskName(entry.profiles?.display_name)[0];
                return (
                  <View key={entry.user_id} style={[styles.podiumItem, { marginTop: podiumIndex === 1 ? 0 : 20 }]}>
                    <View style={[styles.podiumAvatar, { borderColor: podiumIndex === 1 ? '#D4AF37' : '#E5E7EB' }]}>
                      {entry.profiles?.avatar_url ? (
                        <Image source={{ uri: entry.profiles.avatar_url }} style={styles.podiumAvatarImage} />
                      ) : (
                        <Text style={styles.podiumAvatarText}>{initials}</Text>
                      )}
                    </View>
                    <Text style={styles.podiumMedal}>{MEDAL[rankOrder - 1]}</Text>
                    <Text style={styles.podiumName} numberOfLines={1}>{maskName(entry.profiles?.display_name)}</Text>
                    <Text style={styles.podiumScore}>{entry.score.toLocaleString()}</Text>
                    <View style={[styles.podiumBar, { height: heights[podiumIndex], backgroundColor: podiumIndex === 1 ? '#1B4332' : podiumIndex === 0 ? '#94A3B8' : '#CD7F32' }]}>
                      <Text style={styles.podiumRank}>#{rankOrder}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Full list */}
          <View style={styles.list}>
            {data.map((entry, index) => {
              const isMe = entry.user_id === user?.id;
              const tierColor = TIER_COLORS[entry.profiles?.legend_tier ?? ''] ?? '#888';
              return (
                <View key={entry.user_id} style={[styles.row, isMe && styles.rowMe]}>
                  <Text style={styles.rowRank}>
                    {index < 3 ? MEDAL[index] : `#${entry.rank}`}
                  </Text>
                  <View style={[styles.rowAvatar, { borderColor: tierColor }]}>
                    {entry.profiles?.avatar_url ? (
                      <Image source={{ uri: entry.profiles.avatar_url }} style={styles.rowAvatarImage} />
                    ) : (
                      <Text style={styles.rowAvatarText}>{maskName(entry.profiles?.display_name)[0]}</Text>
                    )}
                  </View>
                  <Text style={[styles.rowName, isMe && styles.rowNameMe]} numberOfLines={1}>
                    {isMe ? 'You' : maskName(entry.profiles?.display_name)}
                  </Text>
                  <Text style={styles.rowScore}>{entry.score.toLocaleString()}</Text>
                </View>
              );
            })}

            {data.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No data yet for this period.</Text>
              </View>
            )}
          </View>

          {/* My rank footer if not in top 50 */}
          {user && !myRank && (
            <View style={styles.myRankFooter}>
              <Text style={styles.myRankText}>You are not ranked yet this month. Keep shopping local!</Text>
            </View>
          )}
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
  tabScroll: { maxHeight: 48 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  tabActive: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  podiumItem: { flex: 1, alignItems: 'center' },
  podiumAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E6F0EC', justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: 4 },
  podiumAvatarImage: { width: '100%', height: '100%', borderRadius: 26 },
  podiumAvatarText: { fontSize: 20, fontWeight: '700', color: '#1B4332' },
  podiumMedal: { fontSize: 18 },
  podiumName: { fontSize: 11, fontWeight: '600', color: '#1A1A1A', marginBottom: 2, maxWidth: 80, textAlign: 'center' },
  podiumScore: { fontSize: 11, color: '#888', marginBottom: 4 },
  podiumBar: { width: '80%', borderTopLeftRadius: 4, borderTopRightRadius: 4, justifyContent: 'flex-start', paddingTop: 8, alignItems: 'center' },
  podiumRank: { color: '#fff', fontWeight: '800', fontSize: 16 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: '#F3F4F6' },
  rowMe: { borderColor: '#1B4332', backgroundColor: '#F0FDF4' },
  rowRank: { width: 32, fontSize: 15, fontWeight: '700', color: '#555' },
  rowAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E6F0EC', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, marginRight: 10 },
  rowAvatarImage: { width: 36, height: 36, borderRadius: 18 },
  rowAvatarText: { fontSize: 14, fontWeight: '700', color: '#1B4332' },
  rowName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#333' },
  rowNameMe: { fontWeight: '700', color: '#1B4332' },
  rowScore: { fontSize: 14, fontWeight: '700', color: '#1B4332' },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 14 },
  myRankFooter: { marginHorizontal: 16, marginBottom: 24, padding: 16, backgroundColor: '#FFF8E1', borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A' },
  myRankText: { fontSize: 13, color: '#92400E', textAlign: 'center' },
});
