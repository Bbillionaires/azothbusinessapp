import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors, FontSize, Spacing, Radius, Shadows } from '../../lib/theme'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

type NotificationType =
  | 'receipt_approved' | 'receipt_rejected' | 'badge_earned'
  | 'review_liked' | 'points_expiring' | 'offer_expiring'
  | 'event_reminder' | 'tier_upgrade' | 'referral_bonus' | 'general'

interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, any>
  read: boolean
  created_at: string
}

const TYPE_STYLES: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; iconColor: string; iconBg: string }> = {
  receipt_approved: { icon: 'checkmark-circle',      iconColor: Colors.success,  iconBg: Colors.successBg },
  receipt_rejected: { icon: 'close-circle',           iconColor: Colors.error,    iconBg: Colors.errorBg },
  badge_earned:     { icon: 'ribbon',                 iconColor: Colors.gold,     iconBg: Colors.goldBg },
  review_liked:     { icon: 'heart',                  iconColor: Colors.error,    iconBg: Colors.errorBg },
  points_expiring:  { icon: 'time',                   iconColor: Colors.warning,  iconBg: Colors.warningBg },
  offer_expiring:   { icon: 'pricetag',               iconColor: Colors.warning,  iconBg: Colors.warningBg },
  event_reminder:   { icon: 'calendar',               iconColor: '#7C3AED',       iconBg: '#F3E8FF' },
  tier_upgrade:     { icon: 'trophy',                 iconColor: Colors.gold,     iconBg: Colors.goldBg },
  referral_bonus:   { icon: 'people',                 iconColor: Colors.primary,  iconBg: Colors.primaryLight },
  general:          { icon: 'notifications',          iconColor: Colors.primary,  iconBg: Colors.primaryLight },
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

export default function NotificationsScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setNotifications((data ?? []) as AppNotification[])
      setLoading(false)
    }
    load()
  }, [user])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAllRead = useCallback(async () => {
    if (!user) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [user])

  const handleMarkRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const renderItem = ({ item }: { item: AppNotification }) => {
    const style = TYPE_STYLES[item.type] ?? TYPE_STYLES.general
    return (
      <Pressable
        style={({ pressed }) => [
          styles.notifCard,
          !item.read && styles.notifCardUnread,
          pressed && styles.notifCardPressed,
        ]}
        onPress={() => handleMarkRead(item.id)}
      >
        <View style={[styles.iconBubble, { backgroundColor: style.iconBg }]}>
          <Ionicons name={style.icon} size={22} color={style.iconColor} />
        </View>

        <View style={styles.notifBody}>
          <View style={styles.notifHeader}>
            <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.notifTime}>{formatRelativeTime(item.created_at)}</Text>
          </View>
          <Text style={styles.notifText} numberOfLines={2}>{item.body}</Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </Pressable>
    )
  }

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={56} color={Colors.textDisabled} />
      <Text style={styles.emptyTitle}>All Caught Up!</Text>
      <Text style={styles.emptyText}>
        No notifications yet. Keep scanning receipts and supporting local businesses!
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <Pressable onPress={handleMarkAllRead} style={styles.headerBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<ListEmpty />}
          contentContainerStyle={notifications.length === 0 ? styles.listEmpty : styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea:            { flex: 1, backgroundColor: Colors.background },
  header:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerBtn:           { minWidth: 80, alignItems: 'flex-start' },
  headerCenter:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  headerTitle:         { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  headerBadge:         { backgroundColor: Colors.error, borderRadius: Radius.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  headerBadgeText:     { color: Colors.textInverse, fontSize: FontSize.xxs, fontWeight: '700' },
  markAllText:         { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', textAlign: 'right', minWidth: 80 },
  loadingContainer:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent:         { padding: Spacing.lg, paddingBottom: Spacing.massive },
  listEmpty:           { flex: 1 },
  notifCard:           { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, ...Shadows.sm },
  notifCardUnread:     { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  notifCardPressed:    { opacity: 0.85 },
  iconBubble:          { width: 44, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody:           { flex: 1 },
  notifHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xxs + 1, gap: Spacing.xs },
  notifTitle:          { flex: 1, fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  notifTime:           { fontSize: FontSize.xxs, color: Colors.textTertiary, flexShrink: 0 },
  notifText:           { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  unreadDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: Spacing.xs, flexShrink: 0 },
  separator:           { height: Spacing.sm },
  emptyState:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.massive, gap: Spacing.md },
  emptyTitle:          { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText:           { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
})
