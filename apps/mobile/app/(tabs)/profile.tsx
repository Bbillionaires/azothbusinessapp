import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { THEME } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [statsData, setStatsData] = useState({ receipts: 0, reviews: 0, referrals: 0, events: 0 });

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [receiptsRes, reviewsRes, referralsRes] = await Promise.all([
        supabase.from('receipts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('referral_events').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id),
      ]);

      setStatsData({
        receipts: receiptsRes.count ?? 0,
        reviews: reviewsRes.count ?? 0,
        referrals: referralsRes.count ?? 0,
        events: 0,
      });
    }
    loadStats();
  }, []);

  const referralUrl = `https://localfirstrewards.com/ref/${profile?.referral_code ?? 'loading'}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Local First Rewards and start earning points at local businesses! Use my referral link: ${referralUrl}`,
        url: referralUrl,
      });
    } catch {}
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const stats = [
    { label: 'Receipts', value: String(statsData.receipts), icon: '🧾' },
    { label: 'Reviews', value: String(statsData.reviews), icon: '⭐' },
    { label: 'Referrals', value: String(statsData.referrals), icon: '👥' },
    { label: 'Events', value: String(statsData.events), icon: '📅' },
  ];

  const menuSections = [
    {
      title: 'My Activity',
      items: [
        { icon: 'bookmark-outline', label: 'Saved Businesses', onPress: () => {} },
        { icon: 'star-outline', label: 'My Reviews', onPress: () => {} },
        { icon: 'briefcase-outline', label: 'Job Applications', onPress: () => {} },
        { icon: 'calendar-outline', label: 'My Events', onPress: () => {} },
        { icon: 'receipt-outline', label: 'Receipt History', onPress: () => router.push('/(tabs)/scan') },
      ],
    },
    {
      title: 'Rewards & Referrals',
      items: [
        { icon: 'gift-outline', label: 'My Rewards', onPress: () => router.push('/(tabs)/rewards') },
        { icon: 'people-outline', label: 'Referral Program', onPress: () => router.push('/referrals') },
        { icon: 'trophy-outline', label: 'Leaderboard', onPress: () => router.push('/leaderboard') },
        { icon: 'ribbon-outline', label: 'Community Legends', onPress: () => router.push('/legends') },
        { icon: 'pricetag-outline', label: 'Local Deals', onPress: () => router.push('/offers') },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', onPress: () => router.push('/profile/edit') },
        { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/notifications') },
        { icon: 'settings-outline', label: 'App Settings', onPress: () => router.push('/settings') },
        { icon: 'people-circle-outline', label: 'Investor Portal', onPress: () => router.push('/investor') },
        { icon: 'document-text-outline', label: 'Terms of Service', onPress: () => {} },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileTop}>
            <Avatar
              uri={profile?.avatar_url}
              name={profile?.full_name ?? 'User'}
              size={72}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.full_name ?? 'Local Champion'}</Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
              <View style={styles.tierRow}>
                <Badge
                  label={(profile?.tier ?? 'Bronze').toUpperCase()}
                  variant="primary"
                  size="sm"
                />
                {profile?.tier === 'legend' || profile?.tier === 'gold' ? (
                  <Badge label="Community Legend" variant="gold" size="sm" />
                ) : null}
              </View>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {stats.map((stat, i) => (
              <View key={i} style={[styles.statBox, i < stats.length - 1 && styles.statBorder]}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Points summary */}
        <TouchableOpacity
          style={styles.pointsCard}
          onPress={() => router.push('/(tabs)/rewards')}
        >
          <View>
            <Text style={styles.pointsLabel}>Points Balance</Text>
            <Text style={styles.pointsValue}>{(profile?.points_balance ?? 0).toLocaleString()} pts</Text>
          </View>
          <View style={styles.pointsRight}>
            <Text style={styles.redeemText}>Redeem →</Text>
          </View>
        </TouchableOpacity>

        {/* Referral card */}
        <View style={styles.referralCard}>
          <View style={styles.referralTop}>
            <View>
              <Text style={styles.referralTitle}>🔗 Your Referral Link</Text>
              <Text style={styles.referralUrl} numberOfLines={1}>{referralUrl}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={18} color="#fff" />
            <Text style={styles.shareBtnText}>Share & Earn 100 Points</Text>
          </TouchableOpacity>
        </View>

        {/* Menu sections */}
        {menuSections.map((section, si) => (
          <View key={si} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[styles.menuItem, ii < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={item.onPress}
                >
                  <Ionicons name={item.icon as any} size={20} color={THEME.colors.textSecondary} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={THEME.colors.border} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Push notifications toggle */}
        <View style={styles.menuSection}>
          <View style={styles.menuCard}>
            <View style={styles.toggleItem}>
              <Ionicons name="notifications-outline" size={20} color={THEME.colors.textSecondary} />
              <Text style={styles.menuLabel}>Push Notifications</Text>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: THEME.colors.border, true: THEME.colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={THEME.colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Local First Rewards™ v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  profileHeader: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  profileTop: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  profileInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  profileName: { fontSize: 18, fontWeight: '700', color: THEME.colors.text },
  profileEmail: { fontSize: 13, color: THEME.colors.textSecondary },
  tierRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 14,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statBorder: { borderRightWidth: 1, borderRightColor: THEME.colors.border },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 17, fontWeight: '700', color: THEME.colors.text },
  statLabel: { fontSize: 11, color: THEME.colors.textSecondary },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.primary,
    margin: 16,
    marginBottom: 0,
    borderRadius: 14,
    padding: 16,
  },
  pointsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  pointsValue: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
  pointsRight: {},
  redeemText: { color: THEME.colors.gold, fontWeight: '700', fontSize: 15 },
  referralCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
  },
  referralTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  referralTitle: { fontSize: 15, fontWeight: '700', color: THEME.colors.text, marginBottom: 4 },
  referralUrl: { fontSize: 13, color: THEME.colors.textSecondary },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  menuSection: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: THEME.colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: THEME.colors.border },
  menuLabel: { flex: 1, fontSize: 15, color: THEME.colors.text },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.colors.error,
    gap: 8,
  },
  signOutText: { color: THEME.colors.error, fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: THEME.colors.textSecondary, fontSize: 12, marginBottom: 40 },
});
