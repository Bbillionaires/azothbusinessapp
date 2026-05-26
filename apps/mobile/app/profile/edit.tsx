// =============================================================================
// Profile Edit Screen
// =============================================================================

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Colors, FontSize, Spacing, Radius, Shadows } from '../../lib/theme'

export default function ProfileEditScreen() {
  const router = useRouter()
  const { user, profile, updateProfile } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Pre-fill from existing profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.full_name ?? '')
      setBio(profile.bio ?? '')
      setAvatarUrl(profile.avatar_url ?? null)
    }
  }, [profile])

  // ── Avatar picker ─────────────────────────────────────────────────────────
  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    setAvatarUri(asset.uri)

    // Upload immediately to Supabase Storage
    if (!user) return
    setUploadingAvatar(true)
    try {
      const response = await fetch(asset.uri)
      const blob = await response.blob()

      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg'
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'
      const path = `avatars/${user.id}/avatar.jpg`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: mimeType, upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(urlData.publicUrl)
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message ?? 'Could not upload avatar. It will not be saved.')
      setAvatarUri(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const trimmedName = displayName.trim()
    if (!trimmedName) {
      Alert.alert('Validation', 'Display name cannot be empty.')
      return
    }

    setSaving(true)
    const { error } = await updateProfile({
      full_name: trimmedName,
      bio: bio.trim(),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    setSaving(false)

    if (error) {
      Alert.alert('Error', error)
    } else {
      Alert.alert('Saved!', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    }
  }

  const currentAvatar = avatarUri ?? avatarUrl

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
            disabled={saving || uploadingAvatar}
          >
            {saving
              ? <ActivityIndicator size="small" color={Colors.textInverse} />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Pressable
              style={({ pressed }) => [styles.avatarWrapper, pressed && styles.avatarWrapperPressed]}
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
            >
              {currentAvatar ? (
                <Image source={{ uri: currentAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={44} color={Colors.textTertiary} />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                {uploadingAvatar
                  ? <ActivityIndicator size="small" color={Colors.textInverse} />
                  : <Ionicons name="camera" size={16} color={Colors.textInverse} />
                }
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>
              {uploadingAvatar ? 'Uploading…' : 'Tap to change photo'}
            </Text>
          </View>

          {/* Form fields */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your display name"
              placeholderTextColor={Colors.textDisabled}
              autoCorrect={false}
              maxLength={50}
              returnKeyType="next"
            />
            <Text style={styles.charCount}>{displayName.length}/50</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the community a bit about yourself…"
              placeholderTextColor={Colors.textDisabled}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>

          {/* Save button (also in header, duplicated for bottom of scroll) */}
          <Pressable
            style={({ pressed }) => [styles.bottomSaveBtn, pressed && styles.bottomSaveBtnPressed, (saving || uploadingAvatar) && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving || uploadingAvatar}
          >
            {saving
              ? <ActivityIndicator color={Colors.textInverse} />
              : <Text style={styles.bottomSaveBtnText}>Save Changes</Text>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  headerBtn: {
    width: 44,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
  },
  saveBtnPressed: { opacity: 0.85 },
  saveBtnText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.massive,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    marginTop: Spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatarWrapperPressed: { opacity: 0.8 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceAlt,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatarHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  input: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background,
  },
  bioInput: {
    height: 100,
    paddingTop: Spacing.sm + 2,
  },
  charCount: {
    fontSize: FontSize.xxs,
    color: Colors.textDisabled,
    textAlign: 'right',
    marginTop: Spacing.xxs,
  },
  bottomSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  bottomSaveBtnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.6 },
  bottomSaveBtnText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
})
