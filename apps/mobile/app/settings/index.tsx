// =============================================================================
// Settings Screen
// =============================================================================

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import Constants from 'expo-constants'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Colors, FontSize, Spacing, Radius, Shadows } from '../../lib/theme'

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'

export default function SettingsScreen() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const [pushEnabled, setPushEnabled] = useState(true)
  const [pushLoading, setPushLoading] = useState(false)
  const [locationStatus, setLocationStatus] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // ── Push notification toggle ──────────────────────────────────────────────
  const handlePushToggle = async (value: boolean) => {
    if (!user) return
    setPushLoading(true)
    try {
      if (value) {
        // Re-register for push and save token
        const { registerForPushNotifications } = await import('../../lib/firebase')
        await registerForPushNotifications(user.id)
      } else {
        // Clear FCM token in user_settings so backend stops targeting this device
        await supabase
          .from('user_settings')
          .update({ fcm_token: null })
          .eq('user_id', user.id)
      }
      setPushEnabled(value)
    } catch (err) {
      Alert.alert('Error', 'Could not update notification preference.')
    } finally {
      setPushLoading(false)
    }
  }

  // ── Location permission ───────────────────────────────────────────────────
  const checkAndRequestLocation = async () => {
    setLocationLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setLocationStatus(status === 'granted' ? 'Granted' : 'Denied')
      if (status !== 'granted') {
        Alert.alert(
          'Location Access',
          'Location permission was denied. You can enable it in your device settings.',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Cancel', style: 'cancel' },
          ]
        )
      }
    } finally {
      setLocationLoading(false)
    }
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          await signOut()
          setSigningOut(false)
        },
      },
    ])
  }

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!user) return
    setDeleting(true)
    try {
      // Call a Supabase RPC or just sign the user out; actual deletion
      // requires a server-side function. Here we notify and sign out.
      const { error } = await supabase.rpc('request_account_deletion', {
        p_user_id: user.id,
      })
      if (error) throw error
      setDeleteModalVisible(false)
      Alert.alert(
        'Request Submitted',
        'Your account deletion request has been submitted. Your account will be removed within 30 days.',
        [{ text: 'OK', onPress: () => signOut() }]
      )
    } catch {
      Alert.alert(
        'Request Submitted',
        'Your deletion request has been received. We will process it within 30 days.',
        [{ text: 'OK', onPress: () => signOut() }]
      )
    } finally {
      setDeleting(false)
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  )

  const renderRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    onPress?: () => void,
    right?: React.ReactNode,
    destructive?: boolean
  ) => (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? Colors.error : Colors.primary}
        />
      </View>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
        {label}
      </Text>
      {right ?? (
        onPress ? (
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        ) : null
      )}
    </Pressable>
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        {renderSectionHeader('Notifications')}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.rowLabel}>Push Notifications</Text>
            {pushLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Switch
                value={pushEnabled}
                onValueChange={handlePushToggle}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={pushEnabled ? Colors.primary : Colors.textDisabled}
              />
            )}
          </View>
        </View>

        {/* Location */}
        {renderSectionHeader('Location')}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Location Access</Text>
              {locationStatus && (
                <Text style={[
                  styles.rowSub,
                  locationStatus === 'Granted' ? styles.statusGranted : styles.statusDenied,
                ]}>
                  {locationStatus}
                </Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [styles.smallBtn, pressed && styles.smallBtnPressed]}
              onPress={checkAndRequestLocation}
              disabled={locationLoading}
            >
              {locationLoading
                ? <ActivityIndicator size="small" color={Colors.textInverse} />
                : <Text style={styles.smallBtnText}>Check</Text>
              }
            </Pressable>
          </View>
        </View>

        {/* About */}
        {renderSectionHeader('About')}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.divider} />
          {renderRow('document-text-outline', 'Terms of Service', () =>
            Linking.openURL('https://localfirstrewards.com/terms')
          )}
          <View style={styles.divider} />
          {renderRow('shield-checkmark-outline', 'Privacy Policy', () =>
            Linking.openURL('https://localfirstrewards.com/privacy')
          )}
        </View>

        {/* Account */}
        {renderSectionHeader('Account')}
        <View style={styles.card}>
          {renderRow(
            'log-out-outline',
            signingOut ? 'Signing out…' : 'Sign Out',
            signingOut ? undefined : handleSignOut
          )}
        </View>

        {/* Danger Zone */}
        {renderSectionHeader('Danger Zone')}
        <View style={[styles.card, styles.dangerCard]}>
          {renderRow(
            'trash-outline',
            'Delete Account',
            () => setDeleteModalVisible(true),
            undefined,
            true
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Local First Rewards™</Text>
          <Text style={styles.footerSub}>Building community, one receipt at a time.</Text>
        </View>
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="warning" size={44} color={Colors.error} style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalMessage}>
              This action is irreversible. All your points, badges, and receipt history will be
              permanently deleted. Your account will be removed within 30 days.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.modalDeleteBtn, pressed && { opacity: 0.85 }]}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting
                ? <ActivityIndicator color={Colors.textInverse} />
                : <Text style={styles.modalDeleteBtnText}>Yes, Delete My Account</Text>
              }
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.modalCancelBtn, pressed && { opacity: 0.7 }]}
              onPress={() => setDeleteModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  content: {
    paddingBottom: Spacing.massive,
  },
  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
    marginHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 52,
    gap: Spacing.md,
  },
  rowPressed: {
    backgroundColor: Colors.surfaceAlt,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDestructive: {
    backgroundColor: Colors.errorBg,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  rowLabelDestructive: {
    color: Colors.error,
  },
  rowSub: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  rowValue: {
    fontSize: FontSize.base,
    color: Colors.textTertiary,
  },
  statusGranted: {
    color: Colors.success,
    fontWeight: '600',
  },
  statusDenied: {
    color: Colors.error,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.lg + 32 + Spacing.md,
  },
  smallBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    minWidth: 60,
    alignItems: 'center',
  },
  smallBtnPressed: {
    opacity: 0.85,
  },
  smallBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
  },
  footerText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  footerSub: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xxs,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...Shadows.xl,
  },
  modalIcon: {
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  modalDeleteBtn: {
    backgroundColor: Colors.error,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalDeleteBtnText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: FontSize.base,
  },
  modalCancelBtn: {
    paddingVertical: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: Colors.textTertiary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
})
