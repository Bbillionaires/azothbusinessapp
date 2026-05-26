'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Clock, DollarSign, Briefcase } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { useBusiness } from '@/hooks/useBusiness'
import { createClient } from '@/lib/supabase'

interface Service {
  id: string
  name: string
  description: string | null
  price: number | null
  duration_minutes: number | null
  created_at: string
}

interface NewServiceForm {
  name: string
  description: string
  price: string
  duration_minutes: string
}

const EMPTY_FORM: NewServiceForm = {
  name: '',
  description: '',
  price: '',
  duration_minutes: '',
}

function ServicesContent() {
  const supabase = createClient()
  const { business, loading: bizLoading } = useBusiness()
  const { showToast } = useToast()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewServiceForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!business?.id) return
    fetchServices()
  }, [business?.id])

  async function fetchServices() {
    if (!business?.id) return
    try {
      const res = await fetch(`/api/businesses/${business.id}/services`)
      if (!res.ok) throw new Error('Failed to load services')
      const json = await res.json()
      setServices(json.services ?? [])
    } catch {
      showToast('Could not load services', 'error')
    } finally {
      setLoading(false)
    }
  }

  function updateForm(field: keyof NewServiceForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!business?.id) return
    if (!form.name.trim()) {
      showToast('Service name is required', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/businesses/${business.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: form.price ? parseFloat(form.price) : null,
          duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes, 10) : null,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Failed to add service')
      }

      const json = await res.json()
      setServices(prev => [json.service, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
      showToast('Service added!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add service', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(serviceId: string) {
    if (!business?.id) return
    setDeletingId(serviceId)
    try {
      const res = await fetch(`/api/businesses/${business.id}/services/${serviceId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Failed to delete service')
      }

      setServices(prev => prev.filter(s => s.id !== serviceId))
      showToast('Service removed', 'info')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  function formatDuration(minutes: number | null) {
    if (!minutes) return null
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
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
    <div className="page-container max-w-3xl">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="page-title">Services &amp; Offerings</h1>
            <p className="page-subtitle">
              List the services your business provides so customers know what you offer.
            </p>
          </div>
          <Button
            onClick={() => {
              setShowForm(prev => !prev)
              setForm(EMPTY_FORM)
            }}
            leftIcon={<Plus size={16} />}
            size="sm"
          >
            Add Service
          </Button>
        </div>
      </div>

      {/* Inline add form */}
      {showForm && (
        <section className="section-card mb-6 border-brand-green-200 bg-brand-green-50/40">
          <h2 className="font-semibold text-gray-900 mb-4">New Service</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input
              label="Service name"
              required
              value={form.name}
              onChange={e => updateForm('name', e.target.value)}
              placeholder="e.g. Haircut, Consultation, Oil Change"
            />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={e => updateForm('description', e.target.value)}
                rows={3}
                placeholder="Brief description of the service (optional)"
                className="w-full rounded-lg border border-gray-300 hover:border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent transition-colors resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price ($)"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => updateForm('price', e.target.value)}
                placeholder="0.00"
                leftAddon={<DollarSign size={14} />}
              />
              <Input
                label="Duration (minutes)"
                type="number"
                min="1"
                step="1"
                value={form.duration_minutes}
                onChange={e => updateForm('duration_minutes', e.target.value)}
                placeholder="60"
                leftAddon={<Clock size={14} />}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={saving}>
                Add service
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setForm(EMPTY_FORM)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Services list */}
      {services.length === 0 ? (
        <div className="section-card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Briefcase size={22} className="text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700">No services yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Click &quot;Add Service&quot; to list your first offering.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(service => (
            <div
              key={service.id}
              className="section-card flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{service.name}</p>
                {service.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  {service.price != null && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-brand-green-700">
                      <DollarSign size={13} />
                      {service.price.toFixed(2)}
                    </span>
                  )}
                  {service.duration_minutes != null && (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock size={13} />
                      {formatDuration(service.duration_minutes)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(service.id)}
                disabled={deletingId === service.id}
                className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                aria-label={`Delete ${service.name}`}
              >
                {deletingId === service.id ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ServicesPage() {
  return (
    <ToastProvider>
      <ServicesContent />
    </ToastProvider>
  )
}
