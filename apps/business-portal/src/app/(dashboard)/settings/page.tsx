'use client'

import { useState, useEffect } from 'react'
import { User, Bell, Lock } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase'

interface UserSettings {
  email_notifications: boolean
  push_notifications: boolean
}

function SettingsContent() {
  const supabase = createClient()
  const { showToast } = useToast()

  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const [notifications, setNotifications] = useState<UserSettings>({
    email_notifications: true,
    push_notifications: true,
  })
  const [savingNotifs, setSavingNotifs] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        setEmail(user.email ?? '')

        // Load profile display name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (profile) setDisplayName(profile.full_name ?? '')

        // Load user settings
        const { data: settings } = await supabase
          .from('user_settings')
          .select('email_notifications, push_notifications')
          .eq('user_id', user.id)
          .single()

        if (settings) {
          setNotifications({
            email_notifications: settings.email_notifications ?? true,
            push_notifications: settings.push_notifications ?? true,
          })
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault()
    setSavingAccount(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: displayName.trim(), updated_at: new Date().toISOString() })

      if (error) throw error
      showToast('Account details saved!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error')
    } finally {
      setSavingAccount(false)
    }
  }

  async function handlePasswordReset() {
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      showToast('Password reset email sent — check your inbox.', 'info')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send reset email', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleSaveNotifications() {
    setSavingNotifs(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        email_notifications: notifications.email_notifications,
        push_notifications: notifications.push_notifications,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      showToast('Notification preferences saved!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error')
    } finally {
      setSavingNotifs(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green-700 border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container max-w-2xl">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Account Settings</h1>
        <p className="page-subtitle">Manage your account details and preferences.</p>
      </div>

      {/* Account section */}
      <section className="section-card mb-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-brand-green-700" />
          <h2 className="font-semibold text-gray-900">Account</h2>
        </div>

        <form onSubmit={handleSaveAccount} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            value={email}
            readOnly
            disabled
            hint="Your email address cannot be changed here."
          />
          <Input
            label="Display name"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="How you appear to customers"
            maxLength={80}
          />

          <div className="flex items-center justify-between pt-1">
            <Button type="submit" loading={savingAccount}>
              Save changes
            </Button>
          </div>
        </form>

        <hr className="my-5 border-gray-100" />

        <div className="flex items-center gap-2 mb-3">
          <Lock size={16} className="text-gray-500" />
          <span className="font-medium text-gray-700 text-sm">Password</span>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          We will send a password reset link to your email address.
        </p>
        <Button
          variant="secondary"
          size="sm"
          loading={changingPassword}
          onClick={handlePasswordReset}
        >
          Send password reset email
        </Button>
      </section>

      {/* Notifications section */}
      <section className="section-card">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-brand-green-700" />
          <h2 className="font-semibold text-gray-900">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Email notifications</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Receive updates about reviews, followers, and offers via email.
              </p>
            </div>
            <Toggle
              checked={notifications.email_notifications}
              onChange={val =>
                setNotifications(prev => ({ ...prev, email_notifications: val }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Push notifications</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Get real-time alerts on your device via the mobile app.
              </p>
            </div>
            <Toggle
              checked={notifications.push_notifications}
              onChange={val =>
                setNotifications(prev => ({ ...prev, push_notifications: val }))
              }
            />
          </div>
        </div>

        <div className="pt-5">
          <Button loading={savingNotifs} onClick={handleSaveNotifications}>
            Save preferences
          </Button>
        </div>
      </section>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsContent />
    </ToastProvider>
  )
}
