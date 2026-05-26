import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRewards, usePointsHistory, useRedeemReward } from '../../hooks/useRewards';
import { useAuth } from '../../hooks/useAuth';
import { RewardCard } from '../../components/rewards/RewardCard';
import { PointsHistory } from '../../components/rewards/PointsHistory';
import { THEME } from '../../lib/theme';
import { TIER_THRESHOLDS } from '../../../packages/shared/src/constants/points';

const REWARD_CATEGORIES = ['All', 'Discounts', 'Gift Cards', 'Coupons', 'Events', 'Community'];

type Tab = 'earn' | 'redeem' | 'history';

export default function RewardsScreen() {
  const { profile } = useAuth();
  const { data: rewards = [], loading: isLoading } = useRewards();
  const { data: pointsHistory = [] } = usePointsHistory();
  const { redeem: redeemReward } = useRedeemReward();
  const [activeTab, setActiveTab] = useState<Tab>('redeem');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const points = profile?.points_balance ?? 0;
  const totalEarned = profile?.total_points_earned ?? 0;
  const tier = profile?.tier ?? 'bronze';

  const tierInfo = TIER_THRESHOLDS.find(t => t.tier === tier);
  const nextTier = TIER_THRESHOLDS.find(t => t.minPoints > points);
  const progressPct = nextTier
    ? Math.min(100, ((points - (tierInfo?.minPoints ?? 0)) / ((nextTier.minPoints ?? points + 1) - (tierInfo?.minPoints ?? 0))) * 100)
    : 100;

  const filteredRewards = rewards.filter(r =>
    selectedCategory === 'All' ||
    (r.type ?? '').toLowerCase().includes(selectedCategory.toLowerCase())
  );

  const TIER_COLORS: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: THEME.colors.gold,
    platinum: '#E5E4E2',
    legend: '#1B4332',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Points hero card */}
        <View style={[styles.heroCard, { backgroundColor: THEME.colors.primary }]}>
          <View style={styles.tierBadge}>
            <Text style={[styles.tierText, { color: TIER_COLORS[tier] ?? '#fff' }]}>
              {tier.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.heroLabel}>Your Points Balance</Text>
          <Text style={styles.heroPoints}>{points.toLocaleString()}</Text>
          <Text style={styles.heroSub}>{totalEarned.toLocaleString()} total earned</Text>

          {/* Progress bar */}
          {nextTier && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
              </View>
              <Text style={styles.progressLabel}>
                {(nextTier.minPoints - points).toLocaleString()} pts to {nextTier.label.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {([
            { key: 'redeem', label: 'Redeem', icon: 'gift-outline' },
            { key: 'earn', label: 'Earn More', icon: 'trending-up-outline' },
            { key: 'history', label: 'History', icon: 'time-outline' },
          ] as { key: Tab; label: string; icon: string }[]).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? THEME.colors.primary : THEME.colors.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'redeem' && (
          <View>
            {/* Category filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {REWARD_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isLoading ? (
              <ActivityIndicator size="large" color={THEME.colors.primary} style={{ marginTop: 40 }} />
            ) : filteredRewards.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎁</Text>
                <Text style={styles.emptyTitle}>No rewards available</Text>
                <Text style={styles.emptyText}>Check back soon for new rewards!</Text>
              </View>
            ) : (
              <View style={styles.rewardGrid}>
                {filteredRewards.map(reward => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    userPoints={points}
                    onRedeem={() => redeemReward(reward.id)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'earn' && (
          <View style={styles.earnSection}>
            <Text style={styles.sectionTitle}>Ways to Earn Points</Text>
            {[
              { icon: '🧾', title: 'Upload Receipts', desc: '1 point per $1 spent at local businesses', action: 'Scan Now' },
              { icon: '⭐', title: 'Leave Reviews', desc: 'Earn 10 points per review', action: 'Find Businesses' },
              { icon: '👥', title: 'Refer Friends', desc: '100 points when a friend joins', action: 'Share Link' },
              { icon: '📅', title: 'Attend Events', desc: '25 points per event attended', action: 'Browse Events' },
              { icon: '🏢', title: 'Refer Businesses', desc: '500 points when a business joins', action: 'Refer Business' },
              { icon: '💎', title: 'Premium Membership', desc: '2x points on all purchases', action: 'Upgrade' },
            ].map((item, i) => (
              <View key={i} style={styles.earnCard}>
                <Text style={styles.earnIcon}>{item.icon}</Text>
                <View style={styles.earnContent}>
                  <Text style={styles.earnTitle}>{item.title}</Text>
                  <Text style={styles.earnDesc}>{item.desc}</Text>
                </View>
                <TouchableOpacity style={styles.earnBtn}>
                  <Text style={styles.earnBtnText}>{item.action}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.historySection}>
            <PointsHistory transactions={pointsHistory} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  heroCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  tierBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierText: { fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  heroPoints: { color: '#fff', fontSize: 52, fontWeight: '800', letterSpacing: -1 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  progressSection: { width: '100%', marginTop: 16 },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
  },
  progressFill: { height: '100%', backgroundColor: THEME.colors.gold, borderRadius: 3 },
  progressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center', marginTop: 6 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  tabActive: { backgroundColor: THEME.colors.primaryLight },
  tabText: { fontSize: 13, fontWeight: '600', color: THEME.colors.textSecondary },
  tabTextActive: { color: THEME.colors.primary },
  categoryScroll: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  categoryChip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  categoryChipActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
  categoryText: { fontSize: 14, fontWeight: '600', color: THEME.colors.textSecondary },
  categoryTextActive: { color: '#fff' },
  rewardGrid: { paddingHorizontal: 16, gap: 12, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.text, marginBottom: 6 },
  emptyText: { fontSize: 14, color: THEME.colors.textSecondary, textAlign: 'center' },
  earnSection: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.text, marginBottom: 16 },
  earnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  earnIcon: { fontSize: 28 },
  earnContent: { flex: 1 },
  earnTitle: { fontSize: 15, fontWeight: '700', color: THEME.colors.text },
  earnDesc: { fontSize: 13, color: THEME.colors.textSecondary, marginTop: 2 },
  earnBtn: {
    backgroundColor: THEME.colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  earnBtnText: { color: THEME.colors.primary, fontWeight: '700', fontSize: 12 },
  historySection: { paddingHorizontal: 16, paddingBottom: 40 },
});
