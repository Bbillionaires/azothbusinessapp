'use client'

import { useState, useEffect } from 'react'
import { Globe, Instagram, Facebook, Twitter, Youtube, Linkedin } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { useBusiness } from '@/hooks/useBusiness'
import { createClient } from '@/lib/supabase'

interface SocialLinks {
  website: string
  instagram: string
  facebook: string
  twitter: string
  tiktok: string
  youtube: string
  linkedin: string
}

const EMPTY_LINKS: SocialLinks = {
  website: '',
  instagram: '',
  facebook: '',
  twitter: '',
  tiktok: '',
  youtube: '',
  linkedin: '',
}

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.27 8.27 0 0 0 4.84 1.55V6.85a4.85 4.85 0 0 1-1.07-.16z" />
    </svg>
  )
}

const FIELDS: Array<{
  key: keyof SocialLinks
  label: string
  placeholder: string
  icon: React.ReactNode
  prefix?: string
}> = [
  { key: 'website', label: 'Website', placeholder: 'https://yourbusiness.com', icon: <Globe size={16} /> },
  { key: 'instagram', label: 'Instagram', placeholder: 'yourbusiness', icon: <Instagram size={16} />, prefix: 'instagram.com/' },
  { key: 'facebook', label: 'Facebook', placeholder: 'yourbusiness', icon: <Facebook size={16} />, prefix: 'facebook.com/' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'yourbusiness', icon: <Twitter size={16} />, prefix: 'x.com/' },
  { key: 'tiktok', label: 'TikTok', placeholder: '@yourbusiness', icon: <TikTokIcon size={16} />, prefix: 'tiktok.com/' },
  { key: 'youtube', label: 'YouTube', placeholder: '@yourchannel', icon: <Youtube size={16} />, prefix: 'youtube.com/' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'company/yourbusiness', icon: <Linkedin size={16} />, prefix: 'linkedin.com/' },
]

function SocialContent() {
  const supabase = createClient()
  const { business, loading: bizLoading } = useBusiness()
  const { showToast } = useToast()

  const [links, setLinks] = useState<SocialLinks>(EMPTY_LINKS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!business?.id) return

    async function load() {
      try {
        const { data } = await supabase
          .from('business_social')
          .select('platform, url')
          .eq('business_id', business!.id)

        if (data) {
          const mapped: Partial<SocialLinks> = {}
          for (const row of data) {
            if (row.platform in EMPTY_LINKS) {
              mapped[row.platform as keyof SocialLinks] = row.url ?? ''
            }
          }
          setLinks({ ...EMPTY_LINKS, ...mapped })
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [business?.id, supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!business?.id) return

    setSaving(true)
    try {
      const res = await fetch(`/api/businesses/${business.id}/social`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(links),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Failed to save')
      }

      showToast('Links saved!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (bizLoading || loading) {
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
      <div className="page-header">
        <h1 className="page-title">Social Media Links</h1>
        <p className="page-subtitle">
          Add your social profiles so customers can find and follow you everywhere.
        </p>
      </div>

      <section className="section-card">
        <form onSubmit={handleSave} className="space-y-5">
          {FIELDS.map(({ key, label, placeholder, icon, prefix }) => (
            <div key={key}>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <span className="text-gray-400">{icon}</span>
                {label}
              </label>
              {prefix ? (
                <div className="flex rounded-lg border border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-brand-green-600 focus-within:border-transparent overflow-hidden transition-colors">
                  <span className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-xs text-gray-500 shrink-0">
                    {prefix}
                  </span>
                  <input
                    type="text"
                    value={links[key]}
                    onChange={e => setLinks(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-white"
                  />
                </div>
              ) : (
                <Input
                  type="url"
                  value={links[key]}
                  onChange={e => setLinks(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              )}
            </div>
          ))}

          <div className="pt-2">
            <Button type="submit" loading={saving}>
              Save social links
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function SocialPage() {
  return (
    <ToastProvider>
      <SocialContent />
    </ToastProvider>
  )
}
